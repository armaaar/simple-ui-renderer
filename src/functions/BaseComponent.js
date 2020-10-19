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
  Object.values(el.attributes).forEach((attribute) => {
    if (attribute.name[0] === ':') {
      this[attribute.name.substring(1)] = this.parseAttribute(attribute.value);
    }
  })

  // get children of the component
  // filter `mounted` attribute to make sure to remount components
  this.children = (el.innerHTML).replace(/mounted="true"/g, '')

  // get template
  this.template = document.querySelector(`template#${componentName}`).innerHTML;

  // Mompute the final value of a path or properties from this object
  this.getPathValue = (baseObject, pathString, stripQuotes = false) => {

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
        strFunc = strFunc.replace(expression, this.getPathValue(this, path.substring(1)))
      })
      return strFunc;
    }

    // loop though path
    const value = pathString.split('.').reduce(
      (target, current) => current.endsWith(')')
        ? callFunctionFromPath(target, current)
        : typeof target[current] === 'function'
          ? stringfyFunction(target[current])
          : target[current],
    baseObject);

    // quates should always be used around strings unless this is an attribute inside DOM
    return stripQuotes || isIIFE ? value : `'${value}'`;
  }

  this.evaluateFragment= (fragment) => {
    const evaluateNode = (node) => {
      // If text node
      if (node.nodeType === 3) {
        const curlyMatches = [...node.data.matchAll(/{{(.*)}}/g)]
        curlyMatches.forEach(([expression , path]) => {
          node.data = node.data.replace(expression, this.getPathValue(this, path, true))
        })
      }
      // If element
      else if (node.nodeType === 1) {
        Object.values(node.attributes).forEach((attribute) => {
          if (attribute.name[0] === ':') {
            const pureAttrName = attribute.name.substring(1);
            const value = this.getPathValue(this, attribute.value, true)
            node.removeAttribute(attribute.name)
            node.setAttribute(pureAttrName, value)
          }
        })
      }
      node.childNodes.forEach((childNode) => evaluateNode(childNode))
    }

    fragment.childNodes.forEach((node) => evaluateNode(node));
  }

  this.render = () => {
    const fragment = document.createRange().createContextualFragment(this.template)
    this.evaluateFragment(fragment)

    el.innerHTML = '';
    el.appendChild(fragment);
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
