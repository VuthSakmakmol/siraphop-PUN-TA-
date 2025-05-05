<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" app>
      <v-list nav density="compact">
        <!-- Brand -->
        <v-list-item class="mb-2">
          <div>
            <div class="text-h6 font-weight-bold">HR</div>
            <div class="text-caption">TA</div>
          </div>
        </v-list-item>

        <v-divider />

        

        <!-- ✅ Cambodia Dropdown (with right margin inside) -->
<v-list-group v-model="cambodiaGroup">
  <template #activator="{ props }">
    <v-list-item v-bind="props">
      <v-list-item-title>
        <img
  src="https://flagcdn.com/w20/kh.png"
  srcset="https://flagcdn.com/w40/kh.png 2x"
  width="20"
  height="13"
  alt="Cambodia"> Cambodia
      </v-list-item-title>
    </v-list-item>
  </template>

  <!-- Dashboard -->
  <v-list-item :to="'/dashboard'" link class="">
    <v-list-item-title style="gap: 10px; display: flex;">
      <i class="fa-solid fa-database" style="margin-top: 1px;"></i>
      Dashboard
    </v-list-item-title>
  </v-list-item>

  <!-- Requisitions Dropdown -->
  <v-list-group v-model="requisitionGroup" class="">
    <template #activator="{ props }">
      <v-list-item v-bind="props">
        <v-list-item-title style="gap: 10px; display: flex;">
          <i class="fa-solid fa-desktop" style="margin-top: 1px;"></i>
          Job Requisition
        </v-list-item-title>
      </v-list-item>
    </template>

    <v-list-item :to="'/whitecollar/requisitions'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        White Collar
      </v-list-item-title>
    </v-list-item>
    <v-list-item :to="'/bluecollar/requisitions'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        Blue Collar
      </v-list-item-title>
    </v-list-item>
  </v-list-group>

  <!-- Candidates Dropdown -->
  <v-list-group v-model="candidateGroup" class="">
    <template #activator="{ props }">
      <v-list-item v-bind="props">
        <v-list-item-title style="gap: 10px; display: flex;">
          <i class="fa-solid fa-user" style="margin-top: 1px;"></i>
          Candidates
        </v-list-item-title>
      </v-list-item>
    </template>

    <v-list-item :to="'/whitecollar/candidates'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        White Collar
      </v-list-item-title>
    </v-list-item>
    <v-list-item :to="'/bluecollar/candidates'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        Blue Collar
      </v-list-item-title>
    </v-list-item>
  </v-list-group>

  <!-- Data Entry -->
  <v-list-group v-model="deptGroup" class="">
    <template #activator="{ props }">
      <v-list-item v-bind="props">
        <v-list-item-title style="gap: 10px; display: flex;">
          <i class="fa-solid fa-gears" style="margin-top: 1px;"></i>
          Data Entry
        </v-list-item-title>
      </v-list-item>
    </template>

    <v-list-item :to="'/whitecollar/departments'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        White Collar
      </v-list-item-title>
    </v-list-item>

    <v-list-item :to="'/bluecollar/departments'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-users" style="margin-top: 1px;"></i>
        Blue Collar
      </v-list-item-title>
    </v-list-item>

    <!-- ✅ Roadmap HC inside Data Entry -->
    <v-list-item :to="'/roadmap'" link>
      <v-list-item-title style="gap: 10px; display: flex;">
        <i class="fa-solid fa-server" style="margin-top: 1px;"></i>
        Target Setting
      </v-list-item-title>
    </v-list-item>
  </v-list-group>
</v-list-group>


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

const drawer = ref(false)
const cambodiaGroup = ref(true)
const deptGroup = ref(true)
const requisitionGroup = ref(true)
const candidateGroup = ref(true)

const router = useRouter()

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>
