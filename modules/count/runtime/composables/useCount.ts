export function useCount() {
  const count = useState('count', () => 0)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  return {
    count,
    increment,
    decrement,
  }
}
