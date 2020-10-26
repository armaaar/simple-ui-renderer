function WordList(el) {
  BaseComponent.call(this, el, 'WordList');

  this.log = (ev) => {
    console.log(ev);
  }

  this.render();
}

window.registerComponent('WordList');
