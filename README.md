# Toxicity Model Inference API

This repository provides a solution for making toxicity inferences on both single sentences and CSV files using the Perspective API and a custom deployed RoBERTa model. The project consists of two main code files: `inference_on_sentence` and `inference_on_file`.

## Overview

### 1. `AWS_ROBERTA_API.js`

This script make simple inferences on the ROBERTA model.

### 2. `perspective_API.js`

This script makes simple inference on the Perspective API.

### 3. `inference_on_sentence.js`

This script is designed to make inferences on a single sentence. The workflow involves two steps:

- **RoBERTa Model:** The input sentence is first passed through a RoBERTa model for toxicity detection. If the RoBERTa model fails to detect toxicity, the sentence proceeds to the next step.

- **Perspective API:** In case the RoBERTa model does not flag toxicity, the sentence is then sent to the Perspective API for additional analysis and toxicity detection.

### 4. `inference_on_file.js`

This script extends the inference process to handle CSV files containing a list of sentences. The workflow mirrors the single sentence inference with two main steps:

- **RoBERTa Model:** The CSV file is processed, and each sentence is individually passed through the RoBERTa model for toxicity detection. Sentences that are not flagged by RoBERTa proceed to the next step.

- **Perspective API:** Sentences that were not flagged by the RoBERTa model are sent to the Perspective API for additional analysis and toxicity detection.


