function WordsList(el) {
  BaseComponent.call(this, el, 'WordsList');

  this.groupedWords = ((words, types) => {
    const wordsObject = {};
    Object.entries(types).forEach(([type, subTypes]) => {
      const typeWords = words.filter((word) => word.type === type);
      if (typeWords.length) {
        wordsObject[type] = typeWords;
        if (subTypes) {
          wordsObject[type].sort((a, b) => subTypes.indexOf(a.subType) - subTypes.indexOf(b.subType));
        }
      }
    });
    return wordsObject;
  })(this.props.words, this.props.structure.types);

  this.render();
}

window.registerComponent('WordsList');
