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

  this.stringfy = (value) => {
    if (typeof value !== 'string') {
      return JSON.stringify(value)
    }
    return value;
  }

  let previousCondition = null;
  this.evaluateNode = (node, LocalNodeVars = {}) => {
    const condition = node.getAttribute && (
      node.getAttribute('~if')
      || node.getAttribute('~elif')
      || node.hasAttribute('~else')
    );
    if (condition) {
      if (node.getAttribute('~if')) {
        // set previousCondition so later tags can access it
        previousCondition = Boolean(compileCode(condition, {...this, ...LocalNodeVars}));
        // If the statement is false
        if (!previousCondition) {
          // don't render
          return node.remove();
        }
      } else if (node.getAttribute('~elif')) {
        // if the previous if statement was true
        // or the current statement is false
        if (
          previousCondition
          || previousCondition === null
          || !compileCode(condition, {...this, ...LocalNodeVars})
        ) {
          return node.remove();
        }
        // else, set previous condition as true
        previousCondition = true;
      } else {
        // if the previous if statement was true
        if (previousCondition || previousCondition === null) {
          // don't render
          return node.remove();
        }
        previousCondition = null;
      }
      node.removeAttribute('~if');
      node.removeAttribute('~elif');
      node.removeAttribute('~else');
      if (!node.nextElementSiblin || (
        !node.nextElementSibling.getAttribute('~elif')
        && !node.nextElementSibling.getAttribute('~else')
      )) {
        previousCondition = null;
      }
    }

    if (node.getAttribute && node.getAttribute('~for')) {
      let loopVal = compileCode(node.getAttribute('~for'), {...this, ...LocalNodeVars});
      if (Array.isArray(loopVal)) loopVal = {...loopVal}
      else if (typeof loopVal !== 'object') loopVal = {...[loopVal]}
      const nodesToClone = node.nodeName === 'TEMPLATE'
        ? Array.from(node.content.childNodes)
        : [node];
      const loopFragment = document.createDocumentFragment();
      Object.entries(loopVal).forEach(([key, value], index) => {
        nodesToClone.forEach((nodeToClone) => {
          cloneNode = nodeToClone.cloneNode(true);
          cloneNode.removeAttribute('~for');
          cloneNode.removeAttribute('~value');
          cloneNode.removeAttribute('~index');
          cloneNode.removeAttribute('~key');
          const localVars = {};
          localVars[node.getAttribute('~value') || 'value'] = value;
          localVars[node.getAttribute('~index') || 'index'] = index;
          localVars[node.getAttribute('~key') || 'key'] = key;
          loopFragment.appendChild(cloneNode);
          this.evaluateNode(cloneNode, {...LocalNodeVars, ...localVars})
        });
      });
      node.replaceWith(loopFragment);
      return;
    }

    // If text node
    if (node.nodeType === 3) {
      const curlyMatches = [...node.data.matchAll(/{{([^(}})]*)}}/g)]
      curlyMatches.forEach(([expression , path]) => {
        const value = compileCode(path, {...this, ...LocalNodeVars});
        if (value.nodeType) { // inline slots
          node.replaceWith(value);
        } else {
          node.data = node.data.replace(expression, value);
        }
      })
    }
    // If element
    else if (node.nodeType === 1) {
      Object.values(node.attributes).forEach((attribute) => {
        if (attribute.name[0] === ':') {
          node.removeAttribute(attribute.name)
          if (attribute.name === ':slot') { // is slot
            const value =  this.slots[attribute.value]
            if (node.nodeName === 'TEMPLATE') {
              node.content.appendChild(value)
            } else {
              node.appendChild(value)
            }
          } else {
            const pureAttrName = attribute.name.substring(1);
            const value = this.stringfy(compileCode(attribute.value, {...this, ...LocalNodeVars}))
            node.setAttribute(pureAttrName, value)
          }
        } else if (attribute.name[0] === '@') {
          node.removeAttribute(attribute.name)
          const pureEventName = attribute.name.substring(1);
          const callBack = compileCode(attribute.value, {...this, ...LocalNodeVars});
          if (typeof callBack === 'function') {
            node.addEventListener(pureEventName, callBack);
          }
        }
      })
    }

    if (node.nodeName === 'TEMPLATE') {
      this.evaluateFragment(node.content, false, LocalNodeVars);
      // slot for a child component
      if (!node.getAttribute('~slot')) {
        node.outerHTML = node.innerHTML
      }
    } else {
      Array.from(node.childNodes).forEach((childNode) => this.evaluateNode(childNode, LocalNodeVars))
    }
  }

  this.evaluateFragment = (fragment, clone = false, LocalNodeVars = {}) => {
    // protect original fragment from change
    const cloneFragment = clone && fragment.cloneNode(true) || fragment;

    Array.from(cloneFragment.childNodes).forEach((node) => this.evaluateNode(node, LocalNodeVars));

    return cloneFragment;
  }

  this.emit = (eventName, parametersObj) => {
    el.dispatchEvent(new CustomEvent(eventName, {  bubbles: true, detail: parametersObj }))
  }

  this.render = () => {
    if (typeof this.prerender === 'function') this.prerender();
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
