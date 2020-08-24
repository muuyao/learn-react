import { createElement, Component, render } from './toy-react';

class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>my component</h1>
        {this.children}
      </div>
    );
  }
}

render(
  <MyComponent id='app' class='c'>
    <span>abc</span>
    <span></span>
    <span></span>
  </MyComponent>,
  document.body
);
