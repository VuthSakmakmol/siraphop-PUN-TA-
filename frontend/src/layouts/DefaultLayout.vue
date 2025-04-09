<template>
    <v-app>
      <!-- Sidebar -->
      <v-navigation-drawer v-model="drawer" app>
  <v-list nav density="compact">
    <!-- Brand -->
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">Trax - TA</v-list-item-title>
        <v-list-item-subtitle>Admin Panel</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider />

    <!-- Dashboard -->
    <v-list-item :to="'/dashboard'" link prepend-icon="mdi-view-dashboard">
      <v-list-item-title>Dashboard</v-list-item-title>
    </v-list-item>

    <!-- Departments Dropdown -->
    <v-list-group v-model="deptGroup" prepend-icon="mdi-office-building">
      <template #activator="{ props }">
        <v-list-item v-bind="props">
          <v-list-item-title>Departments</v-list-item-title>
        </v-list-item>
      </template>

      <v-list-item :to="'/whitecollar/departments'" link>
        <v-list-item-title>White Collar</v-list-item-title>
      </v-list-item>
      <v-list-item :to="'/bluecollar/departments'" link>
        <v-list-item-title>Blue Collar</v-list-item-title>
      </v-list-item>
    </v-list-group>

    <!-- Requisitions Dropdown -->
    <v-list-group v-model="requisitionGroup" prepend-icon="mdi-briefcase">
      <template #activator="{ props }">
        <v-list-item v-bind="props">
          <v-list-item-title>Job Requisitions</v-list-item-title>
        </v-list-item>
      </template>

      <v-list-item :to="'/whitecollar/requisitions'" link>
        <v-list-item-title>White Collar</v-list-item-title>
      </v-list-item>
      <v-list-item :to="'/bluecollar/requisitions'" link>
        <v-list-item-title>Blue Collar</v-list-item-title>
      </v-list-item>
    </v-list-group>

    <!-- Candidates Dropdown -->
    <v-list-group v-model="candidateGroup" prepend-icon="mdi-account-group">
      <template #activator="{ props }">
        <v-list-item v-bind="props">
          <v-list-item-title>Candidates</v-list-item-title>
        </v-list-item>
      </template>

      <v-list-item :to="'/whitecollar/candidates'" link>
        <v-list-item-title>White Collar</v-list-item-title>
      </v-list-item>
      <v-list-item :to="'/bluecollar/candidates'" link>
        <v-list-item-title>Blue Collar</v-list-item-title>
      </v-list-item>
    </v-list-group>

    <!-- Reports -->
    <v-list-item :to="'/reports'" link prepend-icon="mdi-chart-box-outline">
      <v-list-item-title>Reports & Export</v-list-item-title>
    </v-list-item>
  </v-list>
</v-navigation-drawer>

  
      <!-- Top Bar -->
      <v-app-bar app color="primary" dark>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
        <v-toolbar-title>Trax Apparel Cambodia</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-app-bar>
  
      <!-- Main Content -->
      <v-main class="bg-grey-lighten-4">
        <v-container fluid>
          <router-view />
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const drawer = ref(true)
  
  const deptGroup = ref(true)
  const requisitionGroup = ref(true)
  const candidateGroup = ref(true)
  
  const router = useRouter()
  
  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }
  </script>
  