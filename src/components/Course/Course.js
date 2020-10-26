function Course(el) {
  BaseComponent.call(this, el, 'Course');

  this.selectedCourse = this.props.structure.courses[0];

  this.selectCourse = (ev) => {
    this.selectedCourse = ev.detail;
    this.render();
  }

  this.prerender = () => {
    // define computed values
    this.lectures = this.props.lectures
      // Get selected course only
      .filter((lecture) => lecture.course === this.selectedCourse)
      // sort lectures
      .sort((a, b) => a.index - b.index)
  }

  this.render();
}

window.registerComponent('Course');
