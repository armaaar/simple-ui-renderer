function WordCard(el) {
  BaseComponent.call(this, el, 'WordCard')

  // define state
  this.speak = () => {
    textToSpeach(this.props.entry.word)
    this.emit('speak', this.props.entry.word)
  }

  this.render();
}

window.registerComponent('WordCard');
