function WordCard(el) {
  BaseComponent.call(this, el, 'WordCard')

  // define state
  this.speak = (event, word) => {
    textToSpeach(word || this.props.entry.word)
  }

  this.render();
}

window.registerComponent('WordCard');
