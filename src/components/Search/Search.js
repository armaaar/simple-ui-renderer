function Search(el) {
  BaseComponent.call(this, el, 'Search');

  this.searchText = '';

  this.searchTextChange = (ev) => {
    this.searchText = ev.target.value;
    this.render();
    // refocus
    document.getElementById('search-input').value = '';
    document.getElementById('search-input').value = this.searchText;
    document.getElementById('search-input').focus();
  }

  const searchWord = (entry) => {
    if (!this.searchText) return true;

    const searchFor = this.searchText.toLowerCase();
    const searchIn = [
      entry.word,
      ...this.props.structure.languages.map((language) => entry[language])
    ]
    if (entry.variations) {
      searchIn.push(...entry.variations)
    }
    return searchIn.reduce((isFound, word) => (
      isFound || word.toLowerCase().includes(searchFor)
    ), false);
  };

  this.prerender = () => {
    this.words = this.props.lectures.reduce((allWords, lecture) => (
      allWords.concat(lecture.words.filter(searchWord))
    ), []);
  }

  this.render();
}

window.registerComponent('Search');
