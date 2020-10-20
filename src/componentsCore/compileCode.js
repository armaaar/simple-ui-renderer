const sandboxProxies = new WeakMap()

function compileCode (codeToCompile, sandbox = {}) {
  const src = `with (sandbox) { return ${codeToCompile}}`
  const code = new Function('sandbox', src)

  if (!sandboxProxies.has(sandbox)) {
    const sandboxProxy = new Proxy(sandbox, {has, get})
    sandboxProxies.set(sandbox, sandboxProxy)
  }
  return code(sandboxProxies.get(sandbox))
}

function has (target, key) {
  return true
}

function get (target, key) {
  if (key === Symbol.unscopables) return undefined
  return target[key]
}
