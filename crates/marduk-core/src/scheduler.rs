use crate::worker::WorkerId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateEvaluation {
    pub worker_id: WorkerId,
    pub device_id: u32,
    pub queue_depth: usize,
    pub estimated_wait_ms: f64,
    pub estimated_exec_ms: f64,
    pub memory_pressure: f64,
    pub has_model_affinity: bool,
    pub final_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisqualificationRecord {
    pub worker_id: WorkerId,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchedulingDecision {
    pub decision_id: String,
    pub request_id: String,
    pub model: String,
    pub timestamp: DateTime<Utc>,
    pub selected_worker_id: WorkerId,
    pub assigned_device_id: u32,
    pub rationale: String,
    pub candidates_evaluated: Vec<CandidateEvaluation>,
    pub disqualified: Vec<DisqualificationRecord>,
    pub learned_prediction_used: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SchedulerPolicy {
    DeterministicMultiFactor,
    LearnedCost,
    RoundRobinBaseline,
}
