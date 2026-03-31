import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  rules: {
    // 配置了 vite 打包阶段会清除所有log
    'no-console': 'off',
  },
})
