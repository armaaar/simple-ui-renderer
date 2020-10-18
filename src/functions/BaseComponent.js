function BaseComponent(el, componentName) {
  // Disable parent elements styles
  el.style.display = 'unset';
  el.style.position = 'unset';

  // get props
  this.parseValue = (strValue) => {
    try {
      return JSON.parse(strValue);
    } catch (e) {
      return strValue;
    }
  }

  Object.values(el.attributes).forEach((attribute) => {
    if (attribute.name[0] === ':') {
      this[attribute.name.substring(1)] = this.parseValue(attribute.value);
    }
  })

  this.template = document.querySelector(`template#${componentName}`).innerHTML;

  this.getPathValue = (baseObject, pathString, stripQuotes = false) => {

    const callFunctionFromPath = (baseObject, functionPath) => {
      const [functionName, paramsStr] = functionPath.slice(0, -1).split('(')
      const paramsArr = paramsStr.replaceAll(/(\s|\t|\n|\r)/g, '').split(',');
      return baseObject[functionName](...paramsArr);
    }

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

    const value = pathString.split('.').reduce(
      (target, current) => current.endsWith(')')
        ? callFunctionFromPath(target, current)
        : typeof target[current] === 'function'
          ? stringfyFunction(target[current])
          : target[current],
    baseObject);

    return stripQuotes || isIIFE ? value : `'${value}'`;
  }

  this.evaluateTemplate = () => {
    let evaluation = this.template;
    const curlyMatches = [...evaluation.matchAll(/{{(.*)}}/g)]
    curlyMatches.forEach(([expression , path]) => {
      evaluation = evaluation.replace(expression, this.getPathValue(this, path, true))
    })
    const columnMatches = [...evaluation.matchAll(/:(\w+)="(.*)"/g)]
    columnMatches.forEach(([expression , attribute, path]) => {
      evaluation = evaluation.replace(expression, `${attribute}="${this.getPathValue(this, path)}"`)
    })
    return evaluation;
  }

  this.render = () => {
    el.innerHTML = this.evaluateTemplate();
  }
}
