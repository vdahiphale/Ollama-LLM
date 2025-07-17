<template>
  <div class="container">
    <h1>Ollama Query Interface</h1>

    <label class="label">Query</label>
    <textarea v-model="query" rows="12" class="query-input"></textarea>

    <label class="label">Upload File (Optional)</label>
    <input type="file" class="file-input" accept=".pdf,image/*" @change="handleFile" />

    <button class="submit-button" @click="extractData" :disabled="loading">
      {{ loading ? 'Processing...' : 'Submit to LLM' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="result" class="response">
      <div v-html="result"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const file = ref(null)
const query = ref(`I am attaching a University Transcript

Your job is to extract the below details from the attachment -
Course Code
Course Name
Course Credits Earned
Course Grade (Letter Grade if available)
Course Semester

And return the properly formatted HTML table, which I can set in the inner html of div to show the results.`)
const result = ref('')
const loading = ref(false)
const error = ref('')

function handleFile(e) {
  file.value = e.target.files[0]
}

async function extractData() {
  error.value = ''
  result.value = ''
  loading.value = true

  try {
    const formData = new FormData()
    if (file.value) formData.append('file', file.value)
    formData.append('query', query.value)

    const res = await fetch('http://localhost:3001/api/granite', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error)

    result.value = data.html || JSON.stringify(data, null, 2)
  } catch (err) {
    error.value = err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style>
.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: Arial, sans-serif;
  background: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.label {
  display: block;
  margin: 1rem 0 0.5rem;
  font-weight: bold;
}

.query-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-family: monospace;
  font-size: 0.95rem;
}

.file-input {
  display: block;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.submit-button {
  background-color: #007bff;
  color: white;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.submit-button:disabled {
  background-color: #a5c9f4;
  cursor: not-allowed;
}

.response {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  white-space: pre-wrap;
  border-radius: 4px;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
