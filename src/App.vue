<template>
  <div id="app">
   <space></space> 
    <!-- <three-pie></three-pie> -->
    <!-- <pie></pie> -->
  </div>
</template>

<script>
import space from './components/space.vue'
// import threePie from './components/threePie.vue'
//import pie from './components/ThreePie/index.vue'

export default {
  name: 'App',
  components: {
     space,
    // threePie,
    //pie
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
</style>
