<script setup lang="ts">
import Versions from './components/Versions.vue'
</script>

<template>
  <Versions></Versions>
  <svg viewBox="0 0 900 300">
    <use xlink:href="./assets/icons.svg#electron" />
  </svg>
  <h2>You've successfully created an Electron project with Vue and TypeScript</h2>

  <p class="desc">Please try pressing <code>F12</code> to open the devTool</p>

  <p class="desc">
    What features are being added to the project to help you develop, build and pack Electron app
  </p>

  <div class="features">
    <ul>
      <li>
        <p>
          ● Use
          <a target="_blank" href="https://eslint.org/docs/user-guide/getting-started">ESLint</a>
          and <a target="_blank" href="https://prettier.io">Prettier</a> to better lint and style
          your code, help you to write high-quality code.
        </p>
      </li>
      <li>
        <p>
          ● Use
          <a target="_blank" href="https://github.com/alex8088/electron-vite">electron-vite</a>
          compiler, a fast javascript builder integrated with
          <a target="_blank" href="https://vitejs.dev">Vite</a>, and you don't need to care about
          configuration.
        </p>
      </li>
      <li>
        <p>
          ● Use
          <a target="_blank" href="https://github.com/alex8088/electron-toolkit"
            >electron-toolkit</a
          >
          that make you easy to develop. For example: TSconfigs extends, expose common Electron APIs
          to renderer process in preload scripts and effective utils for main process.
        </p>
      </li>
      <li>
        <p>
          ● Use <a target="_blank" href="https://www.electron.build">electron-builder</a> and preset
          common configuration, allows you to easily pack Electron app.
        </p>
      </li>
      <li>
        <p>● More instructions are available in README.md.</p>
      </li>
    </ul>
  </div>

  <p class="footer">
    See
    <a
      target="_blank"
      href="https://github.com/alex8088/quick-start/blob/master/packages/create-electron"
      >create-electron</a
    >
    for more details on each supported template:
    <br />
    <code>sample</code>, <code>sample-ts</code>, <code>vue</code>, <code>vue-ts</code>,
    <code>react</code>, <code>react-ts</code>, <code>svelte</code>, <code>svelte-ts</code>
  </p>
</template>

<style lang="less">
@import './assets/css/styles.less';
</style>
