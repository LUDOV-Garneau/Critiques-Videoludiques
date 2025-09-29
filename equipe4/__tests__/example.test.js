import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers')
  }
  return a + b
}

describe('Utility Functions', () => {
  it('adds two positive numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('adds negative numbers correctly', () => {
    expect(add(-1, -1)).toBe(-2)
  })

  it('handles zero correctly', () => {
    expect(add(0, 0)).toBe(0)
  })

  it('throws error with non-numeric input', () => {
    expect(() => add('a', 1)).toThrow(TypeError)
    expect(() => add(1, 'b')).toThrow(TypeError)
  })
})

// Example 2: Mocked Async Function Test
const fetchData = vi.fn().mockResolvedValue({ data: 'Success' })

describe('Async Operations', () => {
  it('resolves with mocked data', async () => {
    const result = await fetchData()
    expect(result).toEqual({ data: 'Success' })
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('handles rejection', async () => {
    vi.mocked(fetchData).mockRejectedValueOnce(new Error('Failed'))
    await expect(fetchData()).rejects.toThrow('Failed')
  })
})

// Example 3: Vue Component Test
const DummyComponent = {
  template: '<div>{{ message }}</div>',
  props: ['message'],
  methods: {
    getUpperCase() {
      return this.message.toUpperCase()
    }
  }
}

describe('DummyComponent', () => {
  it('renders message prop correctly', () => {
    const wrapper = mount(DummyComponent, {
      props: { message: 'hello' }
    })
    expect(wrapper.text()).toBe('hello')
  })

  it('converts message to uppercase via method', () => {
    const wrapper = mount(DummyComponent, {
      props: { message: 'hello' }
    })
    expect(wrapper.vm.getUpperCase()).toBe('HELLO')
  })

  it('emits no errors with empty prop', () => {
    const wrapper = mount(DummyComponent, { props: { message: '' } })
    expect(wrapper.text()).toBe('')
    expect(() => wrapper.vm.getUpperCase()).not.toThrow()
  })
})

// Example 4: Snapshot Test
describe('Snapshot Testing', () => {
  it('matches snapshot of component', () => {
    const wrapper = mount(DummyComponent, { props: { message: 'snapshot test' } })
    expect(wrapper.html()).toMatchSnapshot()
  })
})

// Example 5: Event Handling Test
const ButtonComponent = {
  template: '<button @click="onClick">Click Me</button>',
  methods: {
    onClick() {
      this.$emit('click-event')
    }
  }
}

describe('ButtonComponent', () => {
  it('emits click-event on button click', async () => {
    const wrapper = mount(ButtonComponent)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click-event')).toBeTruthy()
    expect(wrapper.emitted('click-event').length).toBe(1)
  })
})
