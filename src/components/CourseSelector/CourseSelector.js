function CourseSelector(el) {
  BaseComponent.call(this, el, 'CourseSelector');

  this.selectCourse = (courseName) => {
    this.emit('select', courseName);
  }

  this.render();
}

window.registerComponent('CourseSelector');
