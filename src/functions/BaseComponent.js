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

  // Manipulate template string to replace placeholders with actual data
  this.evaluateTemplate = () => {
    let evaluation = this.template;
    // evaluate placeholders
    const curlyMatches = [...evaluation.matchAll(/{{(.*)}}/g)]
    curlyMatches.forEach(([expression , path]) => {
      evaluation = evaluation.replace(expression, this.getPathValue(this, path, true))
    })
    // evaluate attribute binding
    const columnMatches = [...evaluation.matchAll(/:(\w+)="(.*)"/g)]
    columnMatches.forEach(([expression , attribute, path]) => {
      evaluation = evaluation.replace(expression, `${attribute}="${this.getPathValue(this, path)}"`)
    })
    return evaluation;
  }

  this.render = () => {
    el.innerHTML = this.evaluateTemplate();
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
      .querySelectorAll(`${strToKababCase(componentName)}:not([mounted])`)
      .forEach((el) => new window[componentName](el))
  })
}
window.addEventListener('load', window.mountComponents);
