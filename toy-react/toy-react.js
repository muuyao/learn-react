const RENDER_TO_DOM = Symbol('render to dom');

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
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  get vdom() {
    return this.render().vdom;
  }

  update() {
    const isSameNOde = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }

      for (const name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false;
        }
      }

      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false;
      }

      if (newNode.type === '#text') {
        return newNode.content === oldNode.content;
      }

      return true;
    };
    const update = (oldNode, newNode) => {
      if (!isSameNOde(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }

      newNode._range = oldNode._range;

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let index = 0; index < newChildren.length; index++) {
        const newChild = newChildren[index];
        const oldChild = oldChildren[index];

        if (index < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          const range = document.createRange();

          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);

          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };

    let vdom = this.vdom;
    update(this._vdom, vdom);

    this._vdom = vdom;
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

    this.update();
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;

    const root = document.createElement(this.type);

    for (let name in this.props) {
      const value = this.props[name];
      if (name.match(/^on([\s\S]+)/)) {
        root.addEventListener(
          RegExp.$1.replace(/[\s\S]/, c => c.toLowerCase()),
          value
        );
      } else {
        if (name === 'className') {
          name = 'class';
        }
        root.setAttribute(name, value);
      }
    }

    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom);
    }

    for (const child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      childRange.deleteContents();
      child[RENDER_TO_DOM](childRange);
    }

    replaceContent(range, root);
  }

  get vdom() {
    this.vchildren = this.children.map(child => child.vdom);
    return this;
    /*  {
      type: this.type,
      props: this.porps,
      children: this.children.map(child => child.vdom),
    }; */
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.type = '#text';
    this.content = content;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    const root = document.createTextNode(this.content);
    replaceContent(range, root);
  }

  get vdom() {
    return this;
    /* return {
      type: '#text',
      content: this.content,
    }; */
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();
  range.setStartBefore(node);
  range.setEndAfter(node);
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
