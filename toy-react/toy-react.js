class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }

  appendChild(component) {
    this.root.appendChild(component.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];

    this._root = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.children.push(component);
  }

  get root() {
    if (!this._root) {
      this._root = this.render().root;
    }

    return this._root;
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
  parentElement.appendChild(component.root);
}
