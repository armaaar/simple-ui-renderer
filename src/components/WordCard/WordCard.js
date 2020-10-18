function WordCard({ entry }) {
  this.speak = () => {
    textToSpeach(entry.word)
  }
}
