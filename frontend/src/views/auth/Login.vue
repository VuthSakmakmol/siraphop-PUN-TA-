<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-10" elevation="12" max-width="600" width="100%">
      <v-card-title class="text-h3 font-weight-bold text-center mb-6">Login</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="login">
          <v-text-field
            label="Email"
            v-model="email"
            type="email"
            required
            prepend-icon="mdi-email"
            density="comfortable"
            class="text-h6 mb-6"
          />
          <v-text-field
            label="Password"
            v-model="password"
            type="password"
            required
            prepend-icon="mdi-lock"
            density="comfortable"
            class="text-h6 mb-6"
          />
          <v-btn 
            color="primary" 
            class="mt-8 text-h6 py-5" 
            type="submit" 
            block
            size="x-large"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

const login = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: email.value,
      password: password.value
    })

    localStorage.setItem('token', res.data.token)
    localStorage.setItem('admin', JSON.stringify(res.data))

    Swal.fire({
      icon: 'success',
      title: 'Login successful',
      timer: 1500,
      showConfirmButton: false,
    })

    router.push('/dashboard')
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Login failed',
      text: err.response?.data?.message || 'Something went wrong',
    })
  }
}
</script>
