function WordCard(el) {
  BaseComponent.call(this, el, 'WordCard')

  // define state
  this.speak = () => {
    textToSpeach(this.entry.word)
  }

  this.render();
}

window.addEventListener('load', () => {
  document.querySelectorAll('word-card').forEach((el) => new WordCard(el))
});
