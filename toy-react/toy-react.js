const RENDER_TO_DOM = Symbol('render to dom');

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/[\s\S]/, c => c.toLowerCase()),
        value
      );
    } else {
      if (name === 'className') {
        name = 'class';
      }
      this.root.setAttribute(name, value);
    }
  }

  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];

    this._root = null;
    this._range = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.children.push(component);
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }

  rerender() {
    const oldRange = this._range;
    const range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);

    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
      return;
    }
    const merge = (oldState, newState) => {
      for (const key in newState) {
        if (oldState[key] === null || typeof oldState[key] !== 'object') {
          oldState[key] = newState[key];
        } else {
          merge(oldState[key], newState[key]);
        }
      }
    };

    merge(this.state, newState);

    this.rerender();
  }
}

/**
 *
 * @param {String} type 节点名称
 * @param {Object} attributes 属性
 * @param  {...any} children 子节点
 */
export function createElement(type, attributes, ...children) {
  let node;

  if (typeof type === 'string') {
    node = new ElementWrapper(type);
  } else {
    node = new type();
  }

  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      node.setAttribute(key, attributes[key]);
    }
  }

  const insertChildren = children => {
    for (const child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child);
      }

      if (child === null) {
        continue;
      }

      if (Array.isArray(child)) {
        insertChildren(child);
      } else {
        node.appendChild(child);
      }
    }
  };

  insertChildren(children);

  return node;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();

  component[RENDER_TO_DOM](range);
}
