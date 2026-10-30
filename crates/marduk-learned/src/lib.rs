use chrono::{DateTime, Utc};
use marduk_core::error::{MardukError, Result};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::Path;
use std::sync::Arc;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionTrace {
    pub trace_id: String,
    pub timestamp: DateTime<Utc>,
    pub model: String,
    pub device_id: u32,
    pub prompt_tokens: f64,
    pub target_tokens: f64,
    pub queue_depth: f64,
    pub memory_pressure: f64,
    pub measured_ttft_ms: f64,
    pub measured_total_latency_ms: f64,
    pub measured_peak_vram_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictionOutput {
    pub estimated_ttft_ms: f64,
    pub estimated_total_latency_ms: f64,
    pub estimated_peak_vram_mb: f64,
}

/// Fully-connected Neural Network Layer with autograd / gradient descent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinearLayer {
    pub in_features: usize,
    pub out_features: usize,
    pub weights: Vec<Vec<f64>>,
    pub biases: Vec<f64>,
}

impl LinearLayer {
    pub fn new(in_features: usize, out_features: usize) -> Self {
        let mut weights = Vec::with_capacity(out_features);
        let scale = (2.0 / (in_features + out_features) as f64).sqrt();
        for i in 0..out_features {
            let mut row = Vec::with_capacity(in_features);
            for j in 0..in_features {
                // Deterministic pseudo-random Xavier initialization
                let val = (((i * 31 + j * 17 + 7) % 100) as f64 / 100.0 - 0.5) * scale;
                row.push(val);
            }
            weights.push(row);
        }
        let biases = vec![0.01; out_features];
        Self {
            in_features,
            out_features,
            weights,
            biases,
        }
    }

    #[allow(clippy::needless_range_loop)]
    pub fn forward(&self, input: &[f64]) -> Vec<f64> {
        let mut output = Vec::with_capacity(self.out_features);
        for i in 0..self.out_features {
            let mut sum = self.biases[i];
            for j in 0..self.in_features {
                sum += self.weights[i][j] * input[j];
            }
            output.push(sum);
        }
        output
    }
}

/// Multi-Layer Perceptron for Latency and Resource Prediction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkloadPredictorModel {
    pub layer1: LinearLayer, // 4 inputs -> 16 hidden
    pub layer2: LinearLayer, // 16 hidden -> 16 hidden
    pub layer3: LinearLayer, // 16 hidden -> 3 outputs (TTFT, Total Latency, Peak VRAM)
}

impl WorkloadPredictorModel {
    pub fn new() -> Self {
        Self {
            layer1: LinearLayer::new(4, 16),
            layer2: LinearLayer::new(16, 16),
            layer3: LinearLayer::new(16, 3),
        }
    }

    pub fn predict(&self, input: &[f64; 4]) -> PredictionOutput {
        // Forward layer 1 with ReLU
        let h1: Vec<f64> = self
            .layer1
            .forward(input)
            .into_iter()
            .map(|x| x.max(0.0))
            .collect();
        // Forward layer 2 with ReLU
        let h2: Vec<f64> = self
            .layer2
            .forward(&h1)
            .into_iter()
            .map(|x| x.max(0.0))
            .collect();
        // Forward layer 3 (linear regression output)
        let out = self.layer3.forward(&h2);

        PredictionOutput {
            estimated_ttft_ms: out[0].max(1.0),
            estimated_total_latency_ms: out[1].max(5.0),
            estimated_peak_vram_mb: out[2].max(10.0),
        }
    }

    /// Single gradient descent training step with Mean Squared Error (MSE) loss
    #[allow(clippy::needless_range_loop)]
    pub fn train_step(&mut self, input: &[f64; 4], targets: &[f64; 3], lr: f64) -> f64 {
        // Forward pass
        let z1 = self.layer1.forward(input);
        let a1: Vec<f64> = z1.iter().map(|&x| x.max(0.0)).collect();

        let z2 = self.layer2.forward(&a1);
        let a2: Vec<f64> = z2.iter().map(|&x| x.max(0.0)).collect();

        let out = self.layer3.forward(&a2);

        // Compute loss (MSE) and output error gradient
        let mut loss = 0.0;
        let mut d_out = [0.0; 3];
        for i in 0..3 {
            let diff = out[i] - targets[i];
            loss += diff * diff;
            d_out[i] = 2.0 * diff; // derivative of MSE
        }
        loss /= 3.0;

        // Backprop Layer 3
        let mut d_a2 = [0.0; 16];
        for i in 0..3 {
            for j in 0..16 {
                d_a2[j] += d_out[i] * self.layer3.weights[i][j];
                self.layer3.weights[i][j] -= lr * d_out[i] * a2[j];
            }
            self.layer3.biases[i] -= lr * d_out[i];
        }

        // Backprop ReLU & Layer 2
        let mut d_z2 = [0.0; 16];
        for j in 0..16 {
            d_z2[j] = if z2[j] > 0.0 { d_a2[j] } else { 0.0 };
        }

        let mut d_a1 = [0.0; 16];
        for i in 0..16 {
            for j in 0..16 {
                d_a1[j] += d_z2[i] * self.layer2.weights[i][j];
                self.layer2.weights[i][j] -= lr * d_z2[i] * a1[j];
            }
            self.layer2.biases[i] -= lr * d_z2[i];
        }

        // Backprop ReLU & Layer 1
        let mut d_z1 = [0.0; 16];
        for j in 0..16 {
            d_z1[j] = if z1[j] > 0.0 { d_a1[j] } else { 0.0 };
        }

        for i in 0..16 {
            for j in 0..4 {
                self.layer1.weights[i][j] -= lr * d_z1[i] * input[j];
            }
            self.layer1.biases[i] -= lr * d_z1[i];
        }

        loss
    }

    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let file = File::create(path).map_err(|e| {
            MardukError::Internal(format!("Failed to create model checkpoint: {}", e))
        })?;
        let writer = BufWriter::new(file);
        serde_json::to_writer_pretty(writer, self).map_err(|e| {
            MardukError::Internal(format!("Failed to serialize model checkpoint: {}", e))
        })?;
        Ok(())
    }

    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let file = File::open(path).map_err(|e| {
            MardukError::Internal(format!("Failed to open model checkpoint: {}", e))
        })?;
        let reader = BufReader::new(file);
        let model = serde_json::from_reader(reader).map_err(|e| {
            MardukError::Internal(format!("Failed to deserialize model checkpoint: {}", e))
        })?;
        Ok(model)
    }
}

impl Default for WorkloadPredictorModel {
    fn default() -> Self {
        Self::new()
    }
}

pub struct LearnedSchedulerEngine {
    model: RwLock<WorkloadPredictorModel>,
    trace_buffer: Arc<RwLock<VecDeque<ExecutionTrace>>>,
    max_trace_buffer_size: usize,
}

impl LearnedSchedulerEngine {
    pub fn new() -> Self {
        Self {
            model: RwLock::new(WorkloadPredictorModel::new()),
            trace_buffer: Arc::new(RwLock::new(VecDeque::with_capacity(1000))),
            max_trace_buffer_size: 1000,
        }
    }

    pub fn record_trace(&self, trace: ExecutionTrace) {
        let mut buf = self.trace_buffer.write();
        if buf.len() >= self.max_trace_buffer_size {
            buf.pop_front();
        }
        buf.push_back(trace);
    }

    pub fn predict_workload(
        &self,
        prompt_tokens: f64,
        target_tokens: f64,
        queue_depth: f64,
        memory_pressure: f64,
    ) -> PredictionOutput {
        let input = [
            prompt_tokens / 1000.0,
            target_tokens / 1000.0,
            queue_depth / 10.0,
            memory_pressure,
        ];
        self.model.read().predict(&input)
    }

    pub fn train_on_collected_traces(&self, epochs: usize, learning_rate: f64) -> Result<f64> {
        let traces: Vec<ExecutionTrace> = self.trace_buffer.read().iter().cloned().collect();
        if traces.len() < 10 {
            return Err(MardukError::Inference(
                "Insufficient traces for training (minimum 10 required)".to_string(),
            ));
        }

        // Split 80% train, 20% validation
        let split_idx = (traces.len() as f64 * 0.8) as usize;
        let train_set = &traces[..split_idx];
        let val_set = &traces[split_idx..];

        let mut final_loss = 0.0;
        let mut model_lock = self.model.write();

        for epoch in 0..epochs {
            let mut epoch_loss = 0.0;
            for t in train_set {
                let input = [
                    t.prompt_tokens / 1000.0,
                    t.target_tokens / 1000.0,
                    t.queue_depth / 10.0,
                    t.memory_pressure,
                ];
                let target = [
                    t.measured_ttft_ms,
                    t.measured_total_latency_ms,
                    t.measured_peak_vram_mb,
                ];
                epoch_loss += model_lock.train_step(&input, &target, learning_rate);
            }
            final_loss = epoch_loss / train_set.len() as f64;
            if (epoch + 1) % 10 == 0 || epoch == epochs - 1 {
                info!(
                    "Epoch {}/{}: Train MSE Loss = {:.4}",
                    epoch + 1,
                    epochs,
                    final_loss
                );
            }
        }

        // Validation evaluation
        let mut val_loss = 0.0;
        for t in val_set {
            let input = [
                t.prompt_tokens / 1000.0,
                t.target_tokens / 1000.0,
                t.queue_depth / 10.0,
                t.memory_pressure,
            ];
            let pred = model_lock.predict(&input);
            val_loss += (pred.estimated_total_latency_ms - t.measured_total_latency_ms).powi(2);
        }
        val_loss /= val_set.len().max(1) as f64;
        info!("Validation MSE Loss on held-out set: {:.4}", val_loss);

        Ok(final_loss)
    }
}

impl Default for LearnedSchedulerEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_predictor_forward_and_train() {
        let mut model = WorkloadPredictorModel::new();
        let input = [0.1, 0.05, 0.2, 0.5];
        let targets = [15.0, 60.0, 512.0];

        let initial_loss = model.train_step(&input, &targets, 0.001);
        assert!(initial_loss >= 0.0);

        for _ in 0..50 {
            model.train_step(&input, &targets, 0.001);
        }

        let pred = model.predict(&input);
        assert!(pred.estimated_ttft_ms > 0.0);
        assert!(pred.estimated_total_latency_ms > 0.0);
    }
}
