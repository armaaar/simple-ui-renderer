function ModeSelector(el) {
  BaseComponent.call(this, el, 'ModeSelector');

  this.modes = [
    'Words',
    'Courses'
  ];

  this.selectedMode = this.modes[0];

  this.selectMode = (ev) => {
    this.selectedMode = ev.detail;
    this.render();
  }

  this.render();
}

window.registerComponent('ModeSelector');
