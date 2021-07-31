
/***
 *     _____ _            _____            _            
 *    |_   _| |          |  ___|          (_)           
 *      | | | |__   ___  | |__ _ __   __ _ _ _ __   ___ 
 *      | | | '_ \ / _ \ |  __| '_ \ / _` | | '_ \ / _ \
 *      | | | | | |  __/ | |__| | | | (_| | | | | |  __/
 *      \_/ |_| |_|\___| \____/_| |_|\__, |_|_| |_|\___|
 *                                    __/ |             
 *                                   |___/              
 */
 /*
    Returns the Tester object, which is responsible for querying the DOM and performing tests.

    Each active_test creates its own instance of Tester, referenced in active_test as `iwant`.
 */


  /*
  TODO:
  Breadth traversal spawns depth traversal

  Traveral operations carry function to evaluate.

  Report back to some kind of state manager object that records which tests were run and the results.

  When all tests have reported back, the manager object outputs state of the test as a whole.
  */

  /*
  TODO: error message all over this bitch
  */


  function Target() {
    // TODO: keep innerHTML too? each target should have one.
    this.elements = [];
    this.value = null;
    this.operation = null;
    this.children = [];
    this.parent = null;
  };

  Target.forElements = function (callback) {
    var self = this;
    this.elements.forEach(function (node, index, arr) {
      callback(node, self, index, arr);
    });
  };

  Object.defineProperties(Target, {
    hasChildren: {
      get: function() {
        var hasKids = false;
        if (this.children && this.children.length > 0) {
          hasKids = true;
        };
        return hasKids;
      }
    },
    hasValue: {
      get: function() {
        var somethingThere = false;
        if (this.value !== null && this.value !== undefined) {
          somethingThere = true;
        };
        return somethingThere;
      }
    }
  });

  function Tester() {};
  Tester.documentValueSpecified = null;
  Tester.target = null;
  Tester.needToIterate = false;
  Tester.lastOperation = null;
  Tester.gradeOpposite = false;
  Tester.testingExistence = false;
  Tester.picky = false;

  Tester.traverseTargets = function (callback, config) {
    // traverse through the entire Target tree
    // use config to determine if all targets should be traversed or if it, for instance, breaks after the first value gets hit.

    // http://www.timlabonne.com/2013/07/tree-traversals-with-javascript/
    function visitDfs (node, func) {
      if (func) {
        func(node);
      }
   
      node.children.forEach(function (child, index, arr) {
        visitDfs(child, func);
      });
    };
    function visitBfs (node, func) {
      var q = [node];
      while (q.length > 0) {
        node = q.shift();
        if (func) {
          func(node);
        }
 
        node.children.forEach(function (child, index, arr) {
          q.push(child);
        });
      }
    };

    visitDfs(this.target, callback)

    // function depthAndBreadth (ext) {
    //   target = target || this;
    //   target.breadthTraverse(function (kid, self, index, arr) {
    //     callback(kid, self, index, arr);  // maybe?
    //     this.depthTraverse(function () {
    //       callback();
    //       this.depthAndBreadth();
    //     })
    //   });
    // }

  };

  // Tester.expandTree = function (selector, parent) {
  //   // go to bottom level Targets and create new children
  // };

  Tester.wrapUpAndReturn = function (passed) {
    // last work to be done before returning result
    var singleVal = this.documentValueSpecified;
    var multiVal = this.targeted; // probably just want their values, not the nodes

    if (!(this.lastOperation instanceof Array)) {
      this.lastOperation = [this.lastOperation];
    }
    return {
      isCorrect: passed,
      actuals: this.lastOperation
    };
  }

  Tester.grade = function(callback, expectedVal) {
    var self = this;
    var isCorrect = false;

    // technically a helper function, but it's only used here
    var permanentlyWrong = false;
    function genIsCorrect(currCorrect, config) {
      var callback      = config.callback,
          index         = config.index,
          expectedVal   = config.expectedVal || false,
          elem          = config.elem || false,
          currVal       = elem.valueSpecified || config.currVal || config.elem || false;

      var thisIterationIsCorrect = false;

      switch (self.picky) {
        case 'onlyOneOf':
          thisIterationIsCorrect = callback(currVal, expectedVal);
          if (thisIterationIsCorrect && currCorrect) {
            permanentlyWrong = true;
          } else {
            thisIterationIsCorrect = currCorrect || thisIterationIsCorrect;
          }
          break;
        case 'someOf':
          if (index === 0) {
            thisIterationIsCorrect = callback(currVal, expectedVal);
          } else {
            thisIterationIsCorrect = currCorrect || callback(currVal, expectedVal);
          };
          break;
        default:
          if (index === 0) {
            thisIterationIsCorrect = callback(currVal, expectedVal);
          } else {
            thisIterationIsCorrect = currCorrect && callback(currVal, expectedVal);
          };
          break;
      }

      return thisIterationIsCorrect;
    };

    // to adjust for 'not'
    callback = (function(self, callback) {
      var cbFunc = function() {};
      if (self.gradeOpposite) {
        cbFunc = function(x,y) {
          var result = callback(x,y);
          return !result;
        }
      } else {
        cbFunc = function(x,y) {
          var result = callback(x,y);
          return result;
        }
      }
      return cbFunc;
    })(self, callback);

    if (this.documentValueSpecified !== undefined) {
      isCorrect = callback(this.documentValueSpecified, expectedVal);
    } else if (this.needToIterate && !this.testingExistence) {
      this.targeted.forEach(function(elem, index, arr) {
        isCorrect = genIsCorrect(isCorrect, {
          callback: callback,
          index: index,
          expectedVal: expectedVal,
          elem: elem
        })
      })
    } else if (this.testingExistence) {
      this.lastOperation.forEach(function(val, index, arr) {
        isCorrect = genIsCorrect(isCorrect, {
          callback: callback,
          index: index,
          currVal: val
        })
      })
    } else {
      isCorrect = callback();
    }
    return isCorrect && !permanentlyWrong;
  };

  Object.defineProperties(Tester, {
    count: {
      get: function() {
        // if (this.targeted[0].valueSpecified instanceof Array) {
        //   this.targeted.forEach(function(targetedObj, index, arr) {
        //     var tl = targetedObj.valueSpecified.length || -1;
        //     targetedObj.valueSpecified = tl; // TODO: this seems problematic
        //   });
        // } else {
        //   this.documentValueSpecified = this.targeted.length;
        // }
        var self = this;

        this.traverseTargets(function (node) {
          if (node.children.length === 0) {
            node.value = node.elements.length;
          }
        })
        return this;
      }
    },
    toExist: {
      get: function() {
        this.testingExistence = true;
        var lastOperation = this.lastOperation || [];
        
        var doesExist = false;
        
        // typeof null === "object", for some insane reason. This is to correct for it.
        if (lastOperation === null) {
          lastOperation = false;
        }
        var typeOfOperation = typeof lastOperation;
        if (typeOfOperation === "object" && lastOperation instanceof Array) {
          typeOfOperation = "array";
        }

        if (typeOfOperation !== "array") {
          this.lastOperation = [lastOperation]
        }

        var doesExistFunc = function () {};
        var subDoesExist = false;

        switch (typeOfOperation) {
          case "number":
            doesExistFunc = function (x) {
              var subDoesExist = false;
              if (x > 0) {
                subDoesExist = true;
              }
            }
            break;
          case "string":
            doesExistFunc = function (x) {
              var subDoesExist = false;
              if (x.length > 0) {
                subDoesExist = true;
              }
            }
            break;
          case "array":
            doesExistFunc = function (x) {
              if (x) {
                return true;
              } else {
                return false;
              }
            }
            break;
          case "object":
            doesExistFunc = function (x) {
              var subDoesExist = false;
              if (Object.keys(x).length > 0) {
                subDoesExist = true;
              }
            }
            break;
          case "function":
            doesExistFunc = function (x) {
              var subDoesExist = false;
              if (x.getBody().length > 0) {
                subDoesExist = true;
              }
            }
            break;
          default:
            // good for booleans or undefined
            doesExistFunc = function (x) {
              var subDoesExist = false;            
              if (x) {
                subDoesExist = true;
              }
            }
            break;
        }

        doesExist = this.grade(doesExistFunc);
        return this.wrapUpAndReturn(doesExist);
      }
    },
    onlyOneOf: {
      get: function () {
        this.picky = 'onlyOneOf';
        return this;
      }
    },
    not: {
      get: function () {
        this.gradeOpposite = true;
        return this;
      }
    },
    pageImageBytes: {
      get: function () {
        // TODO
      }
    },
    someOf: {
      get: function () {
        this.picky = 'someOf';
        return this;
      }
    },
    UAString: {
      get: function () {
        this.lastOperation = navigator.userAgent;
        this.documentValueSpecified = navigator.userAgent;
        return this;
      }
    },
    value: {
      get: function () {
        // TODO: Tester returns a single value from the first Target hit with a value. Used to create vars in active_tests.
        // return this.documentValueSpecified;
        // var self = this;
        // return self.visitDfs(function() {
        //   console.log(this.value);
        // });
        var value = null;
        this.traverseTargets(function (node) {
          if (node.value) {
            value = node.value
          };
        });
        return value;
      }
    },
    values: {
      get: function () {
        // TODO: Tester returns a <no>flat array of Targets </no>with non-null values. Used to create vars in active_tests.
        var values = [];
        this.traverseTargets(function (node) {
          if (node.hasValue) {
            values.push(node.value);
          };
        });
        return values;
      }
    }
  })

  Tester.theseNodes = function (selector) {
    var operation = 'gatherElements';
    this.lastOperation = operation;

    this.nodes = this.nodes || [];

    this.target = new Target();
    this.target.operation = operation;

    var self = this;
    getDomNodeArray(selector).forEach(function (elem, index, arr) {
      self.target.elements.push(elem);
    });
    
    return this;
  }
  Tester.theseElements = Tester.theseNodes;

  Tester.deepChildren = function (selector) {
    var operation = 'gatherDeepChildElements';
    this.lastOperation = operation;

    var self = this;

    this.traverseTargets(function (node) {
      if (!node.hasChildren) {
        node.elements.forEach(function (elem) {
          var target = new Target();
          target.operation = operation;
          getDomNodeArray(selector, elem).forEach(function (newElem) {
            target.elements.push(newElem);
          });
          node.children.push(target);
        });
      };
    });
    return this;
  };
  Tester.children = Tester.deepChildren;

  Tester.shallowChildren = function (selector) {
    var operation = 'gatherChildElements';
    this.lastOperation = operation;

    var self = this;
    getDomNodeArray(selector, parent).forEach(function (elem, index, arr) {
      self.target.elements.push(elem);
    });
    return this;
  };

  Tester.cssProperty = function (property) {
    var self = this;
    this.needToIterate = true;
    this.lastOperation = [];
    this.targeted.forEach(function (targetObj, index, arr) {
      var styles = getComputedStyle(targetObj.elem);
      targetObj.valueSpecified = styles[property];
      self.lastOperation.push(targetObj.valueSpecified);
    });
    return this;
  }

  Tester.attribute = function (attr) {
    var self = this;
    this.needToIterate = true;
    this.lastOperation = [];
    this.targeted.forEach(function (targetObj, index, arr) {
      var attrValue = targetObj.elem.getAttribute(attr);
      if (attrValue === "") {
        attrValue = true;
      }
      targetObj.valueSpecified = attrValue;
      self.lastOperation.push(targetObj.valueSpecified);
    });
    return this;
  }

  Tester.absolutePosition = function (side) {
    var self = this;
    this.needToIterate = true;
    this.lastOperation = [];

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
        };
        break;
    }

    this.targeted.forEach(function(targetObj, index, arr) {
      targetObj.valueSpecified = selectorFunc(targetObj.elem);
      self.lastOperation.push(targetObj.valueSpecified);
      if (index === 0) {
        self.documentValueSpecified = targetObj.valueSpecified;
      }
    })
    return this;
  };

  /*
    @param: y* (any value)
    @param: noStrict/ (default: false)
  */
  Tester.toEqual = function(y, noStrict) {
    noStrict = noStrict || false;
    
    var isEqual = false;
    var equalityFunc = function() {};
    switch (noStrict) {
      case true:
        equalityFunc = function(x, y) {
          return x == y;
        };
        break;
      case false:
        equalityFunc = function(x, y) {
          return x === y;
        };
        break;
      default:
        equalityFunc = function(x, y) {
          return x === y;
        };
        break;
    }

    isEqual = this.grade(equalityFunc, y);
    return this.wrapUpAndReturn(isEqual);
  }

  Tester.toBeGreaterThan = function(y, orEqualTo) {
    orEqualTo = orEqualTo || false;
    var isGreaterThan = false;

    var greaterThanFunc = function() {};
    switch (orEqualTo) {
      case true:
        greaterThanFunc = function (x, y) {
          var isGreaterThan = false;
          if (x >= y) {
            isGreaterThan = true;
          }
          return isGreaterThan;
        }
      case false:
        greaterThanFunc = function (x, y) {
          var isGreaterThan = false;
          if (x > y) {
            isGreaterThan = true;
          }
          return isGreaterThan;
        }
      default:
        greaterThanFunc = function (x, y) {
          var isGreaterThan = false;
          if (x > y) {
            isGreaterThan = true;
          }
          return isGreaterThan;
        }
    }

    isGreaterThan = this.grade(greaterThanFunc, y);
    return this.wrapUpAndReturn(isGreaterThan);
  }

  Tester.toBeLessThan = function(y, orEqualTo) {
    orEqualTo = orEqualTo || false;
    var isLessThan = false; // TODO: delete?

    var lessThanFunc = function() {};
    switch (orEqualTo) {
      case true:
        lessThanFunc = function (x, y) {
          var isLessThan = false;
          if (x <= y) {
            isLessThan = true;
          }
          return isLessThan;
        }
      case false:
        lessThanFunc = function (x, y) {
          var isLessThan = false;
          if (x < y) {
            isLessThan = true;
          }
          return isLessThan;
        }
      default:
        lessThanFunc = function (x, y) {
          var isLessThan = false;
          if (x < y) {
            isLessThan = true;
          }
          return isLessThan;
        }
    }

    isLessThan = this.grade(lessThanFunc, y);
    return this.wrapUpAndReturn(isLessThan);
  };
  
  Tester.toBeInRange = function(lower, upper, lowerInclusive, upperInclusive) {
    lowerInclusive = lowerInclusive || true;
    upperInclusive = upperInclusive || true;
    var isInRange = false;

    var xIsLessThan = function () {};
    switch (lowerInclusive) {
      case true:
        xIsLessThan = function (x, y) {
          var isInRange = false;
          if (x <= y) {
            isInRange = true;
          }
          return isInRange;
        }
      case false:
        xIsLessThan = function (x, y) {
          var isInRange = false;
          if (x < y) {
            isInRange = true;
          }
          return isInRange;
        }
      default:
        xIsLessThan = function (x, y) {
          var isInRange = false;
          if (x < y) {
            isInRange = true;
          }
          return isInRange;
        }
    }

    var xIsGreaterThan = function () {};
    switch (upperInclusive) {
      case true:
        xIsGreaterThan = function (x, y) {
          var isInRange = false;
          if (x >= y) {
            isInRange = true;
          }
          return isInRange;
        }
      case false:
        xIsGreaterThan = function (x, y) {
          var isInRange = false;
          if (x > y) {
            isInRange = true;
          }
          return isInRange;
        }
      default:
        xIsGreaterThan = function (x, y) {
          var isInRange = false;
          if (x > y) {
            isInRange = true;
          }
          return isInRange;
        }
    }

    var inRangeFunc = function (x, y) {
      var isInRange = false;
      x = x.replace('px', '');
      x = x.replace('%', '');
      if (xIsLessThan(x, range.upper) && xIsGreaterThan(x, range.lower)) {
        isInRange = true;
      }
      return isInRange;
    }

    var range = {upper: upper, lower: lower}; // this is a hack because genIsCorrect expects only one comparison value
    isInRange = this.grade(inRangeFunc, range);
    return this.wrapUpAndReturn(isInRange);
  };

  Tester.toHaveSubstring = function (values, config) {
    var self = this;
    config = config || {};
    this.needToIterate = true;
    // make sure values are an array
    if (!(values instanceof Array)) {
      values = [values];
    };
    var hasRightNumberOfSubstrings = false;

    var nInstances            = config.nInstances || false,   // TODO: not being used (Is there a good use case?)
        minInstances          = config.minInstances || 1,     // TODO: not being used
        maxInstances          = config.maxInstances || false, // TODO: not being used
        nValues               = config.nValues || false,
        minValues             = config.minValues || 1,
        maxValues             = config.maxValues || 'all';

    if (maxValues === 'all') {
      maxValues = values.length;
    };

    // TODO: refactor functionally?
    var substringFunc = function (targetedObj, values) {
      var string = '';
      if (targetedObj instanceof Node) {
        string = targetedObj.innerHTML;
      } else if (targetedObj.elem) {
        string = targetedObj.elem.innerHTML;
      } else {
        string = targetedObj;
      };
      var hasNumberOfValsExpected = false;
      var hits = 0;
      values.forEach(function(val, index, arr) {
        if (string.search(val) > -1) {
          hits+=1;
        };
      });

      if (nValues) {
        (hits === nValues) ? hasNumberOfValsExpected = true : hasNumberOfValsExpected = false;
      } else if (hits >= minValues && hits <= maxValues) {
        hasNumberOfValsExpected = true;
      };
      self.lastOperation = [hasNumberOfValsExpected];
      return hasNumberOfValsExpected;
    };
    hasRightNumberOfSubstrings = this.grade(substringFunc, values);
    return this.wrapUpAndReturn(hasRightNumberOfSubstrings);
  }





