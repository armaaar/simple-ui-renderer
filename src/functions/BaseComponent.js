// TODO: add cleanup script
function BaseComponent(el, componentName) {
  // Add mounted flag
  el.setAttribute('mounted', true)

  // Add component to registered components list if not exist
  window.registerComponent(componentName);

  // Disable parent elements styles
  el.style.display = 'unset';
  el.style.position = 'unset';

  // get props from attributes
  this.parseAttribute = (strValue) => {
    try {
      return JSON.parse(strValue);
    } catch (e) {
      return strValue;
    }
  }

  // Define props
  this.props = {};
  Object.values(el.attributes).forEach((attribute) => {
    if (attribute.name[0] === ':') {
      this.props[attribute.name.substring(1)] = this.parseAttribute(attribute.value);
    }
  })

  // get slots
  this.slots = {};
  Array.from(el.childNodes).forEach((childNode) => {
    if (
      childNode.nodeName === 'TEMPLATE'
      && childNode.getAttribute
      && childNode.getAttribute('~slot')
    ) {
      const slotName = childNode.getAttribute('~slot');
      this.slots[slotName] = childNode.content;
    }
  });

  // get template
  this.template = document.querySelector(`template#${componentName}`).innerHTML;

  // Mompute the final value of a path or properties from this object
  this.getPathValue = (baseObject, pathString, options = {}) => {
    const returnOptions = {
      quotes: false,
      stringfy: false,
      ...options
    }
    // Used to get a function's return value
    const callFunctionFromPath = (baseObject, functionPath) => {
      const [functionName, paramsStr] = functionPath.slice(0, -1).split('(')
      const paramsArr = paramsStr.replaceAll(/(\s|\t|\n|\r)/g, '').split(',');
      return baseObject[functionName](...paramsArr);
    }

    // Create a string containing an Immediately-invoked Function to use for event attributes 'e.g. onclick'
    // is an Immediately-invoked Function
    let isIIFE = false;
    const stringfyFunction = (func) => {
      isIIFE = true;
      let strFunc = `(${func.toString()})()`;
      const thisRefrences = [...strFunc.matchAll(/this((\n*\s*\t*\r*\.\w+(\(\w*\))?)+)/g)];
      thisRefrences.forEach(([expression , path]) => {
        strFunc = strFunc.replace(expression, this.getPathValue(this, path.substring(1), {quotes: true}))
      })
      return strFunc;
    }

    // loop though path
    let value = pathString.trim().split('.').reduce(
      (target, current) => {
        // get function return value
        if (current.endsWith(')')) {
          return callFunctionFromPath(target, current)
        }
        // get IIFE
        if (typeof target[current] === 'function') {
          return stringfyFunction(target[current])
        }
        // get evaluated Node
        if (target[current].nodeType) {
          return this.evaluateFragment(target[current])
        }
        return target[current]
      },
    baseObject);

    if (returnOptions.stringfy && typeof value !== 'string') {
      value = JSON.stringify(value)
    }

    // quates should always be used around strings unless this is an attribute inside DOM
    return !returnOptions.quotes || isIIFE ? value : `'${value}'`;
  }

  this.evaluateFragment= (fragment) => {
    // protect original fragment from change
    const cloneFragment = fragment.cloneNode(true);

    const evaluateNode = (node, LocalNodeVars = {}) => {
      const condition = node.getAttribute && node.getAttribute('~if');
      if (condition && !eval(condition)) {
        return node.remove();
      }

      if (node.getAttribute && node.getAttribute('~for')) {
        let loopVal = this.getPathValue(this, node.getAttribute('~for'));
        if (!Array.isArray(loopVal)) loopVal = [loopVal];
        const loopFragment = document.createDocumentFragment();
        loopVal.forEach((value, index) => {
          const cloneNode = node.cloneNode(true);
          cloneNode.removeAttribute('~for');
          cloneNode.removeAttribute('~value');
          cloneNode.removeAttribute('~index');
          const localVars = {};
          localVars[node.getAttribute('~value') || 'value'] = value;
          localVars[node.getAttribute('~index') || 'index'] = index;
          evaluateNode(cloneNode, {...LocalNodeVars, ...localVars})
          loopFragment.appendChild(cloneNode);
        });
        node.parentNode.replaceChild(loopFragment, node)
        return;
      }

      // If text node
      if (node.nodeType === 3) {
        const curlyMatches = [...node.data.matchAll(/{{\s*([\w\._]*)\s*}}/g)]
        curlyMatches.forEach(([expression , path]) => {
          const value = this.getPathValue({...this, ...LocalNodeVars}, path);
          if (value.nodeType) {
            node.parentNode.replaceChild(value, node);
          } else {
            node.data = node.data.replace(expression, value);
          }
        })
      }
      // If element
      else if (node.nodeType === 1) {
        Object.values(node.attributes).forEach((attribute) => {
          if (attribute.name[0] === ':') {
            const pureAttrName = attribute.name.substring(1);
            const value = this.getPathValue({...this, ...LocalNodeVars}, attribute.value, { stringfy:true })
            node.removeAttribute(attribute.name)
            node.setAttribute(pureAttrName, value)
          }
        })
      }

      if (node.nodeName === 'TEMPLATE') {
        // slot for a child component
        if (node.getAttribute('~slot')) {
          Array.from(node.content.childNodes).forEach((childNode) => evaluateNode(childNode))
        } else {
          node.content.childNodes.forEach((childNode) => evaluateNode(childNode))
          node.outerHTML = node.innerHTML
        }
      } else {
        Array.from(node.childNodes).forEach((childNode) => evaluateNode(childNode))
      }
    }

    Array.from(cloneFragment.childNodes).forEach((node) => evaluateNode(node));

    return cloneFragment;
  }

  this.render = () => {
    const fragment = document.createRange().createContextualFragment(this.template)
    el.innerHTML = '';
    el.appendChild(this.evaluateFragment(fragment));
    window.mountComponents();
  }
}

window.registerComponent = (componentName) => {
  if (!window.registeredComponents) {
    window.registeredComponents = []
  }
  if (!window.registeredComponents.includes(componentName)) {
    window.registeredComponents.push(componentName);
  }
}

window.mountComponents = () => {
  if (!window.registeredComponents) {
    window.registeredComponents = []
  }
  window.registeredComponents.forEach((componentName) => {
    document
      // get all components that are not mounted
      .querySelectorAll(`${strToKababCase(componentName)}:not([mounted])`)
      // double check that a component isn't mounted before creating new component
      //(can happen when nested mountComponents exists)
      .forEach((el) => !el.getAttribute('mounted') && new window[componentName](el))
  })
}
window.addEventListener('load', window.mountComponents);
