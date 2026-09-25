import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  // docs/ 与 content/ 是 Markdown 散文，其中的代码块是文章内容本身
  // （例如讲 debugger 检测的文章必然含 debugger 语句），不参与 lint
  ignores: ['docs/**', 'content/**'],
  rules: {
    // 配置了 vite 打包阶段会清除所有log
    'no-console': 'off',
  },
})
