
/***
 *      _______                   _____      _ _           _                 
 *     |__   __|/\               / ____|    | | |         | |                
 *        | |  /  \     ______  | |     ___ | | | ___  ___| |_ ___  _ __ ___ 
 *        | | / /\ \   |______| | |    / _ \| | |/ _ \/ __| __/ _ \| '__/ __|
 *        | |/ ____ \           | |___| (_) | | |  __/ (__| || (_) | |  \__ \
 *        |_/_/    \_\           \_____\___/|_|_|\___|\___|\__\___/|_|  |___/
 *                                                                           
 *                                                                                   

The Teaching Assistant (TA) is responsible for:
  * collecting data from the page and creating a tree of Targets (called a bullseye) representing the information
  * traverseing the bullseye and reporting relevant data from Targets and grading instructions into a GradeBook.
  * All collectors return the instance of the TA object for chaining.
  * Collectors register their operations with the GradeBook, which actually checks the results of the tests.
*/

/**
 * The TA constructor sets default values and instantiates a GradeBook.
 */
function TA() {
  this.target = null;
  this.gradebook = new GradeBook();
  this.operations = [];
  this.gradeOpposite = false;
  this.picky = false;
  this.queue = new Queue();
};

Object.defineProperties(TA.prototype, {
  childPosition: {
    /**
     * To find a child node's index in relation to its immediate siblings
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.runAgainstBottomTargets(function (target) {
          var elem = target.element;
          var position = null;
          // TODO: correct for other non-normal DOM elems?
          var ignoreTheseNodes = 0;
          Array.prototype.slice.apply(target.element.parentNode.children).forEach(function(val, index, arr) {
            if (val.nodeName === '#text') {
              ignoreTheseNodes += 1;
            }
            if (val === elem) {
              position = index - ignoreTheseNodes;
            }
          });
          return position;
        });
      });

      return this;
    }
  },
  count: {
    /**
     * To count the number of children at the bottom level of the bullseye
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function () {
        // doing more than accessing a property on existing target because counting can move up the bullseye to past Targets. Need to reset operations
        self.registerOperation('count');
        self.runAgainstNextToBottomTargets(function (target) {
          return target.children.length;
        });
      });
      return this;
    }
  },
  index: {
    /**
     * To find the index of a target from when it was created.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.registerOperation('index');
        self.runAgainstBottomTargets(function (target) {
          return target.index;
        });
      });
      return this;
    }
  },
  innerHTML: {
    /**
     * To pull the innerHTML of a DOM node.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.registerOperation('innerHTML');
        self.runAgainstBottomTargetElements(function (element) {
          return element.innerHTML;
        });
      });
      return this;
    }
  },
  not: {
    /**
     * Not a collector! Used by the GradeBook to negate the correctness of a test.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.gradeOpposite = true;
      });
      return this;
    }
  },
  numberOfTargets: {
    /**
     * Not a collector! Private use only. Find the total number of targets in the bullseye.
     * @return {integer} - the number of targets
     */
    get: function () {
      return this.targetIds.length;
    }
  },
  onlyOneOf: {
    /**
     * Not a collector! Used by the GradeBook to set a threshold for number of questions to pass in order to count the whole test as correct.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.picky = 'onlyOneOf';
      });
      return this;
    }
  },
  someOf: {
    /**
     * Not a collector! Used by the GradeBook to set a threshold for number of questions to pass in order to count the whole test as correct.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.picky = 'someOf';
      });
      return this;
    }
  },
  targetIds: {
    /**
     * Not a collector! Private use only. Get an array of all target ids.
     * @return {array} ids of all targets in the bullseye.
     */
    get: function () {
      var ids = [];
      this.traverseTargets(function (target) {
        ids.push(target.id);
      });
      return ids;
    }
  },
  UAString: {
    /**
     * Get the User-Agent string of the browser.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function () {
      var self = this;
      this.queue.add(function () {
        self.operations = navigator.userAgent;
        self.documentValueSpecified = navigator.userAgent;
      });
      return this;
    }
  }
})

/**
 * Initialized for async call later.
 */
TA.prototype.onresult = function (testResult) {};

/**
 * Let the TA know this just happened and refresh the questions in the GradeBook.
 * @param {string} operation - the thing that just happened
 */
TA.prototype.registerOperation = function (operation) {
  this.operations.push(operation);
  this.gradebook.reset();
};

/**
 * Private method to traverse all targets in the bullseye.
 * @param  {Function} callback - method to call against each target
 */
TA.prototype.traverseTargets = function (callback) {
  // http://www.timlabonne.com/2013/07/tree-traversals-with-javascript/

  /**
   * Recursively dive into a tree structure from the top. Used on the Target structure here.
   * @param  {object} node - a target of bullseye. Start with the top.
   * @param  {function} func - function to run against each node
   */
  function visitDfs (node, func) {
    if (func) {
      func(node);
    }
 
    node.children.forEach(function (child, index, arr) {
      visitDfs(child, func);
    });
  };
  visitDfs(this.target, callback);
};

/**
 * Private use only! Run a function against the top-level Target in the bullseye
 * @param  {function} callback - the function to run against specified Targets
 */
TA.prototype.runAgainstTopTargetOnly = function (callback) {
  var self = this;
  this.target.value = callback(this.target);

  if (this.target.value) {
    self.gradebook.recordQuestion(this.target);
  } else {
    this.target.children.forEach(function (kid) {
      self.gradebook.recordQuestion(kid);
    })
  }
};

/**
 * Private use only! Run a function against bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified Targets
 */
TA.prototype.runAgainstBottomTargets = function (callback) {
  var self = this;

  var allTargets = this.targetIds;

  this.traverseTargets(function (target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target);
      
      if (target.value) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function (kid) {
          self.gradebook.recordQuestion(kid);
        })
      }
    };
  });
};

/**
 * Private use only! Run a function against the elements of the bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified elements
 */
TA.prototype.runAgainstBottomTargetElements = function (callback) {
  var self = this;

  var allTargets = this.targetIds;

  this.traverseTargets(function (target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target.element);
      
      if (target.value) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function (kid) {
          self.gradebook.recordQuestion(kid);
        })
      }
    };
  })
};

/**
 * Private use only! Run a function against the next to bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified elements
 */
TA.prototype.runAgainstNextToBottomTargets = function (callback) {
  var self = this;

  this.traverseTargets(function (target) {
    if (target.hasChildren && !target.hasGrandkids) {
      target.value = callback(target);
      
      if (target.value) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function (kid) {
          self.gradebook.recordQuestion(kid);
        })
      }
    };
  });
};

/**
 * Generates the top-level target. Matched elements end up as children targets. It will not have a element.
 * @param  {string} CSS selector - the selector of the elements you want to query
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.theseElements = function (selector) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('gatherElements');

    self.target = new Target();

    self.runAgainstTopTargetOnly(function (topTarget) {
      getDomNodeArray(selector).forEach(function (elem, index, arr) {
        var target = new Target();
        target.element = elem;
        target.index = index;
        topTarget.children.push(target);
      });
    });
  });
  return this;
}
// for legacy quizzes
TA.prototype.theseNodes = TA.prototype.theseElements;

/**
 * Will run a query against the lowest level targets in the Target tree. Note it will traverse all the way down the DOM.
 * @param  {string} CSS selector - the selector of the children you want to query
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.deepChildren = function (selector) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('gatherDeepChildElements');

    self.runAgainstBottomTargets(function (target) {
      getDomNodeArray(selector, target.element).forEach(function (newElem, index) {
        var childTarget = new Target();
        childTarget.element = newElem;
        childTarget.index = index;
        target.children.push(childTarget);
      });
    });
  });

  return this;
};
// for alternate syntax options
TA.prototype.children = TA.prototype.deepChildren;

// TODO: broken :(
TA.prototype.shallowChildren = function (selector) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('gatherShallowChildElements');

    self.runAgainstBottomTargets(function (target) {
      getDomNodeArray(selector, target.element).forEach(function (newElem, index) {
        var childTarget = new Target();
        childTarget.element = newElem;
        childTarget.index = index;
        target.children.push(childTarget);
      });
    });

  });
  return this;
};

/**
 * Get any CSS style of any element.
 * @param  {string} property - the CSS property to examine. Should be camelCased.
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.cssProperty = function (property) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('cssProperty');

    self.runAgainstBottomTargetElements(function (elem) {
      var styles = getComputedStyle(elem);
      // TODO: this is causing a FSL that could affect framerate
      return styles[property];
    });
  });
  return this;
}

/**
 * Get any attribute of any element.
 * @param  {string} attribute - the attribute under examination.
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.attribute = function (attribute) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('attribute')

    self.runAgainstBottomTargetElements(function (elem) {
      var attrValue = elem.getAttribute(attribute);
      if (attrValue === '') {
        attrValue = true;
      }
      return attrValue;
    });
  });
  return this;
}

/**
 * Get the position of one side of an element relative to the viewport
 * @param  {string} side - the side of the element in question
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.absolutePosition = function (side) {
  var self = this;
  this.queue.add(function () {
    self.registerOperation('absolutePosition');
    // http://stackoverflow.com/questions/2880957/detect-inline-block-type-of-a-dom-element
    function getDisplayType (element) {
      var cStyle = element.currentStyle || window.getComputedStyle(element, ""); 
      return cStyle.display;
    };

    var selectorFunc = function () {};
    switch (side) {
      case 'top':
        var selectorFunc = function (elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetTop;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          return value;
        };
        break;
      case 'left':
        var selectorFunc = function (elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetLeft;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          return value;
        };
        break;
      case 'bottom':
        var selectorFunc = function (elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetTop + elem.offsetHeight;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          if (value === Math.max(document.documentElement.clientHeight, window.innerHeight || 0)) {
            value = 'max';
          };
          return value;
        };
        break;
      case 'right':
        var selectorFunc = function (elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetLeft + elem.offsetWidth;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          if (value === Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) {
            value = 'max';
          };
          return value;
        };
        break;
      default:
        selectorFunc = function () {
          console.log("You didn't pick a side for absolutePosition! Options are 'top', 'left', 'bottom' and 'right'.");
          return NaN;
        };
        break;
    };

    self.runAgainstBottomTargetElements(function (elem) {
      return selectorFunc(elem);
    });
  });
  return this;
};