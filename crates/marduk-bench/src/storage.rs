use crate::types::*;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkJobRecord {
    pub id: String,
    pub test_type: String,
    pub device_id: u32,
    pub device_name: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_ms: f64,
    pub status: String,
    pub is_cpu_only: bool,
    pub metrics: Option<BenchmarkMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemRatingRecord {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub cpu_score: f64,
    pub gpu_score: Option<f64>,
    pub overall_tier: String,
    pub device_summary: String,
    pub details_json: String,
}

pub struct LocalBenchmarkStorage {
    conn: Arc<Mutex<Connection>>,
    db_path: PathBuf,
}

impl LocalBenchmarkStorage {
    pub fn default_db_path() -> PathBuf {
        if let Ok(app_data) = std::env::var("APPDATA") {
            let dir = PathBuf::from(app_data).join("marduk");
            let _ = std::fs::create_dir_all(&dir);
            dir.join("marduk.db")
        } else if let Ok(home) = std::env::var("HOME") {
            let dir = PathBuf::from(home).join(".local").join("share").join("marduk");
            let _ = std::fs::create_dir_all(&dir);
            dir.join("marduk.db")
        } else {
            PathBuf::from("marduk.db")
        }
    }

    pub fn new(path: Option<PathBuf>) -> Result<Self, String> {
        let db_path = path.unwrap_or_else(Self::default_db_path);
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open SQLite database: {}", e))?;

        // Enable Write-Ahead Logging for high concurrency
        let _ = conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;",
        );

        let storage = Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
        };

        storage.init_schema()?;
        Ok(storage)
    }

    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| format!("Failed to open in-memory SQLite: {}", e))?;
        let storage = Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path: PathBuf::from(":memory:"),
        };
        storage.init_schema()?;
        Ok(storage)
    }

    fn init_schema(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                test_type TEXT NOT NULL,
                device_id INTEGER NOT NULL,
                device_name TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_ms REAL NOT NULL,
                status TEXT NOT NULL,
                is_cpu_only INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS metrics (
                run_id TEXT PRIMARY KEY,
                achieved_tflops REAL,
                bandwidth_gbps REAL,
                tensor_tflops REAL,
                speedup_vs_fp32 REAL,
                ttft_ms REAL,
                tokens_per_second REAL,
                itl_p50_ms REAL,
                itl_p95_ms REAL,
                temp_delta_c INTEGER,
                peak_temp_c INTEGER,
                stability_score_pct REAL,
                raw_json TEXT NOT NULL,
                FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS system_ratings (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                cpu_score REAL NOT NULL,
                gpu_score REAL,
                overall_tier TEXT NOT NULL,
                device_summary TEXT NOT NULL,
                details_json TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_runs_start_time ON runs(start_time DESC);
            CREATE INDEX IF NOT EXISTS idx_ratings_timestamp ON system_ratings(timestamp DESC);",
        )
        .map_err(|e| format!("Failed to create SQLite schema: {}", e))?;

        Ok(())
    }

    pub fn record_run(&self, job: &BenchmarkJob) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let is_cpu = if job.device_name.to_lowercase().contains("cpu") { 1 } else { 0 };

        let start_time = job.started_at.unwrap_or(job.created_at);

        conn.execute(
            "INSERT OR REPLACE INTO runs (id, test_type, device_id, device_name, start_time, end_time, duration_ms, status, is_cpu_only)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                job.run_id,
                job.test_type.name(),
                job.device_id,
                job.device_name,
                start_time.to_rfc3339(),
                job.ended_at.map(|t| t.to_rfc3339()),
                job.metrics.as_ref().map(|m| m.duration_ms).unwrap_or(0.0),
                format!("{:?}", job.status),
                is_cpu,
            ],
        )
        .map_err(|e| format!("Failed to insert run: {}", e))?;

        if let Some(ref m) = job.metrics {
            let raw_json = serde_json::to_string(m).unwrap_or_else(|_| "{}".to_string());
            conn.execute(
                "INSERT OR REPLACE INTO metrics (run_id, achieved_tflops, bandwidth_gbps, tensor_tflops, speedup_vs_fp32, ttft_ms, tokens_per_second, itl_p50_ms, itl_p95_ms, temp_delta_c, peak_temp_c, stability_score_pct, raw_json)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    job.run_id,
                    m.achieved_tflops,
                    m.bandwidth_gbps,
                    m.tensor_tflops,
                    m.speedup_vs_fp32,
                    m.ttft_ms,
                    m.tokens_per_second,
                    m.inter_token_latency_p50_ms,
                    m.inter_token_latency_p95_ms,
                    m.temp_delta_c,
                    m.peak_temp_c.map(|t| t as i32),
                    m.stability_score_pct,
                    raw_json,
                ],
            )
            .map_err(|e| format!("Failed to insert metrics: {}", e))?;
        }

        Ok(())
    }

    pub fn get_recent_runs(&self, limit: usize) -> Result<Vec<BenchmarkJobRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "SELECT r.id, r.test_type, r.device_id, r.device_name, r.start_time, r.end_time, r.duration_ms, r.status, r.is_cpu_only, m.raw_json
                 FROM runs r
                 LEFT JOIN metrics m ON r.id = m.run_id
                 ORDER BY r.start_time DESC
                 LIMIT ?1",
            )
            .map_err(|e| format!("Query prepare failed: {}", e))?;

        let rows = stmt
            .query_map(params![limit as i64], |row| {
                let id: String = row.get(0)?;
                let test_type: String = row.get(1)?;
                let device_id: u32 = row.get(2)?;
                let device_name: String = row.get(3)?;
                let start_time_str: String = row.get(4)?;
                let end_time_str: Option<String> = row.get(5)?;
                let duration_ms: f64 = row.get(6)?;
                let status: String = row.get(7)?;
                let is_cpu_only: i32 = row.get(8)?;
                let raw_json: Option<String> = row.get(9)?;

                let start_time = DateTime::parse_from_rfc3339(&start_time_str)
                    .map(|d| d.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                let end_time = end_time_str.and_then(|s| {
                    DateTime::parse_from_rfc3339(&s)
                        .map(|d| d.with_timezone(&Utc))
                        .ok()
                });

                let metrics = raw_json.and_then(|j| serde_json::from_str::<BenchmarkMetrics>(&j).ok());

                Ok(BenchmarkJobRecord {
                    id,
                    test_type,
                    device_id,
                    device_name,
                    start_time,
                    end_time,
                    duration_ms,
                    status,
                    is_cpu_only: is_cpu_only != 0,
                    metrics,
                })
            })
            .map_err(|e| format!("Query execution failed: {}", e))?;

        let records: Vec<BenchmarkJobRecord> = rows.flatten().collect();
        Ok(records)
    }

    pub fn record_rating(&self, rating: &SystemRatingRecord) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO system_ratings (id, timestamp, cpu_score, gpu_score, overall_tier, device_summary, details_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                rating.id,
                rating.timestamp.to_rfc3339(),
                rating.cpu_score,
                rating.gpu_score,
                rating.overall_tier,
                rating.device_summary,
                rating.details_json,
            ],
        )
        .map_err(|e| format!("Failed to insert rating: {}", e))?;
        Ok(())
    }

    pub fn get_latest_rating(&self) -> Result<Option<SystemRatingRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "SELECT id, timestamp, cpu_score, gpu_score, overall_tier, device_summary, details_json
                 FROM system_ratings
                 ORDER BY timestamp DESC
                 LIMIT 1",
            )
            .map_err(|e| format!("Query prepare failed: {}", e))?;

        let mut rows = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let ts_str: String = row.get(1)?;
                let cpu_score: f64 = row.get(2)?;
                let gpu_score: Option<f64> = row.get(3)?;
                let overall_tier: String = row.get(4)?;
                let device_summary: String = row.get(5)?;
                let details_json: String = row.get(6)?;

                let timestamp = DateTime::parse_from_rfc3339(&ts_str)
                    .map(|d| d.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                Ok(SystemRatingRecord {
                    id,
                    timestamp,
                    cpu_score,
                    gpu_score,
                    overall_tier,
                    device_summary,
                    details_json,
                })
            })
            .map_err(|e| format!("Query failed: {}", e))?;

        if let Some(r) = rows.next() {
            r.map(Some).map_err(|e| e.to_string())
        } else {
            Ok(None)
        }
    }

    pub fn export_json(&self) -> Result<String, String> {
        let runs = self.get_recent_runs(200)?;
        serde_json::to_string_pretty(&runs).map_err(|e| e.to_string())
    }

    pub fn export_csv(&self) -> Result<String, String> {
        let runs = self.get_recent_runs(200)?;
        let mut csv = String::from("id,test_type,device_name,status,duration_ms,achieved_tflops,bandwidth_gbps,tensor_tflops,start_time\n");
        for r in runs {
            let m = r.metrics.unwrap_or_default();
            csv.push_str(&format!(
                "{},\"{}\",\"{}\",{},{:.2},{:.2},{:.2},{:.2},{}\n",
                r.id,
                r.test_type,
                r.device_name,
                r.status,
                r.duration_ms,
                m.achieved_tflops.unwrap_or(0.0),
                m.bandwidth_gbps.unwrap_or(0.0),
                m.tensor_tflops.unwrap_or(0.0),
                r.start_time.to_rfc3339(),
            ));
        }
        Ok(csv)
    }
}