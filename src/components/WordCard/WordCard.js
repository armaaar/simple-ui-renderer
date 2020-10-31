function WordCard(el) {
  BaseComponent.call(this, el, 'WordCard');

  // define state
  this.speak = (word) => {
    textToSpeach(word || this.props.entry.word);
  }

  const cleanWord = (word) => word.replace(/[^\w\s]/g, '').toLowerCase();

  this.examples = window.allWords.filter((entry) => {
    if (entry.word === this.props.entry.word) return false;
    const searchFor = [cleanWord(this.props.entry.word)];
    if (this.props.entry.variations) {
      searchFor.push(...this.props.entry.variations.map((variation) => cleanWord(variation)))
    }

    const searchIn = [...cleanWord(entry.word).split(' ')];
    if (entry.variations) {
      searchIn.push(...entry.variations.reduce(
        (variations, variation) => variations.concat(cleanWord(variation).split(' '))
      , []));
    }
    return searchIn.reduce((isFound, word) =>(
      isFound || searchFor.includes(word)
    ), false);
  }).map((entry) => {
    const example = {
      word: entry.word
    };
    this.props.structure.languages.forEach((language) => example[language] = entry[language])
    return example;
  });

  this.render();
}

window.registerComponent('WordCard');
