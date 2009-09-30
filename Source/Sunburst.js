/*
 * File: Sunburst.js
 * 
 * Implements the <Sunburst> class and other derived classes.
 *
 * Description:
 *
 * A radial layout of a tree puts the root node on the center of the canvas, places its children on the first concentric ring away from the root node, its grandchildren on a second concentric ring, and so on...
 *
 * Ka-Ping Yee, Danyel Fisher, Rachna Dhamija and Marti Hearst introduced a very interesting paper called "Animated Exploration of Dynamic Graphs with Radial Layout". In this paper they describe a way to animate a radial layout of a tree with ease-in and ease-out transitions, which make transitions from a graph's state to another easier to understand for the viewer.
 *
 * Inspired by:
 *
 * Animated Exploration of Dynamic Graphs with Radial Layout (Ka-Ping Yee, Danyel Fisher, Rachna Dhamija, Marti Hearst)
 *
 * <http://bailando.sims.berkeley.edu/papers/infovis01.htm>
 *
 * Disclaimer:
 *
 * This visualization was built from scratch, taking only the paper as inspiration, and only shares some features with this paper.
 *
 * 
 */

/*
   Class: Sunburst
      
     The main Sunburst class

     Extends:

     <Loader>, <Tips>, <NodeStyles>, <Layouts.Radial>

     Parameters:

     canvas - A <Canvas> Class
     config - A configuration/controller object.

     Configuration:
    
     The configuration object can have the following properties (all properties are optional and have a default value)
     
     *General*

     - _interpolation_ Interpolation type used for animations. Possible options are 'polar' and 'linear'. Default's 'linear'.
     - _levelDistance_ Distance between a parent node and its children. Default's 100.
     - _withLabels_ Whether the visualization should use/create labels or not. Default's *true*.

     *Node*
     
     Customize the visualization nodes' shape, color, and other style properties.

     Inherits options from <Options.Graph.Node>.

     *Edge*

     Customize the visualization edges' shape, color, and other style properties.

     Inherits Options from <Options.Graph.Edge>.
      
    *Animations*

    Inherits from <Options.Animation>.
     
    *Controller options*

    Inherits from <Options.Controller>.
    
    Instance Properties:

    - _graph_ Access a <Graph> instance.
    - _op_ Access a <Sunburst.Op> instance.
    - _fx_ Access a <Sunburst.Plot> instance.
    - _labels_ Access a <Sunburst.Label> interface implementation.

    Example:

    Here goes a complete example. In most cases you won't be forced to implement all properties and methods. In fact, 
    all configuration properties  have the default value assigned.

    I won't be instantiating a <Canvas> class here. If you want to know more about instantiating a <Canvas> class 
    please take a look at the <Canvas> class documentation.

    (start code js)
      var sunburst = new Sunburst(canvas, {
        interpolation: 'linear',
        levelDistance: 100,
        withLabels: true,
        Node: {
          overridable: false,
          type: 'circle',
          color: '#ccb',
          lineWidth: 1,
          height: 5,
          width: 5,
          dim: 3
        },
        Edge: {
          overridable: false,
          type: 'line',
          color: '#ccb',
          lineWidth: 1
        },
        duration: 2500,
        fps: 40,
        transition: Trans.Quart.easeInOut,
        clearCanvas: true,
        onBeforeCompute: function(node) {
          //do something onBeforeCompute
        },
        onAfterCompute:  function () {
          //do something onAfterCompute
        },
        onCreateLabel:   function(domElement, node) {
          //do something onCreateLabel
        },
        onPlaceLabel:    function(domElement, node) {
          //do something onPlaceLabel
        },
        onBeforePlotNode:function(node) {
          //do something onBeforePlotNode
        },
        onAfterPlotNode: function(node) {
          //do something onAfterPlotNode
        },
        onBeforePlotLine:function(adj) {
          //do something onBeforePlotLine
        },
        onAfterPlotLine: function(adj) {
          //do something onAfterPlotLine
        }
      });
    (end code)

*/

this.Sunburst = new Class({
  
  Implements: [Loader, Tips, NodeStyles, Layouts.Radial],
    
  initialize: function(canvas, controller) {
    
    var config= {
      labelContainer: canvas.id + '-label',
      interpolation: 'linear',
      levelDistance: 100,
      withLabels: true,
      Node: {
        'type': 'multipie'
      },
      Edge: {
        'type': 'none'
      },
      Tips: Options.Tips
    };
    
    this.controller = this.config = $merge(Options.Graph, 
        Options.Animation, 
        Options.Controller,
        config, controller);
    
    this.graphOptions = {
        'complex': false,
        'Node': {
            'selected': false,
            'exist': true,
            'drawn': true
        }
    };
    this.graph = new Graph(this.graphOptions, this.config.Node, this.config.Edge);
    this.labels = new Sunburst.Label[canvas.getConfig().labels](this);
    this.fx = new Sunburst.Plot(this);
    this.op = new Sunburst.Op(this);
    this.json = null;
    this.canvas = canvas;
    this.root = null;
    this.busy = false;
    //add tips
    this.initializeTips();
  },
   
  /* 
  
    Method: createLevelDistanceFunc 
  
    Returns the levelDistance function used for calculating a node distance 
    to its origin. This function returns a function that is computed 
    per level and not per node, such that all nodes with the same depth will have the 
    same distance to the origin. The resulting function gets the 
    parent node as parameter and returns a float.

   */
  createLevelDistanceFunc: function() {
    var ld = this.config.levelDistance;
    return function(elem) {
      return (elem._depth + 1) * ld;
    };
  },
  
  
  /* 
     Method: refresh 
     
     Computes nodes' positions and replots the tree.

   */ 
    refresh: function() {
        this.compute();
        this.plot();
    },
    
    /*
     Method: reposition
    
     An alias for computing new positions to _endPos_

     See also:

     <Sunburst.compute>
     
    */
    reposition: function() {
        this.compute('end');
    },


    /*
     Method: plot
    
     Plots the Sunburst
    */
    plot: function() {
        this.fx.plot();
    }
});

/*
   Class: Sunburst.Op

   Performs advanced operations on trees and graphs.

   Extends:

   All <Graph.Op> methods

   Access:

   This instance can be accessed with the _op_ parameter of the <Sunburst> instance created.

   Example:

   (start code js)
    var sunburst = new Sunburst(canvas, config);
    sunburst.op.morph //or can also call any other <Graph.Op> method
   (end code)
   
*/
Sunburst.Op = new Class({

    Implements: Graph.Op,

    initialize: function(viz) {
        this.viz = viz;
    }
});

/*
   Class: Sunburst.Plot

   Performs plotting operations.

   Extends:

   All <Graph.Plot> methods

   Access:

   This instance can be accessed with the _fx_ parameter of the <Sunburst> instance created.

   Example:

   (start code js)
    var sunburst = new Sunburst(canvas, config);
    sunburst.fx.placeLabel //or can also call any other <Sunburst.Plot> method
   (end code)

*/
Sunburst.Plot = new Class({
  
  Implements: Graph.Plot,
  
    initialize: function(viz) {
      this.viz = viz;
      this.config = viz.config;
      this.node = viz.config.Node;
      this.edge = viz.config.Edge;
      this.animation = new Animation;
      this.nodeTypes = new Sunburst.Plot.NodeTypes;
      this.edgeTypes = new Sunburst.Plot.EdgeTypes;
      this.labels = viz.labels;
    }
});


/*
  Object: Sunburst.Label

  Label interface implementation for the Sunburst

  See Also:

  <Graph.Label>, <Sunburst.Label.HTML>, <Sunburst.Label.SVG>

 */ 
Sunburst.Label = {};

/*
   Class: Sunburst.Label.Native

   Implements labels natively, using the Canvas text API.

   Extends:

   <Graph.Label.Native>

   See also:

   <Hypertree.Label>, <Sunburst.Label>, <ST.Label>, <Hypertree>, <Sunburst>, <ST>, <Graph>.

*/
Sunburst.Label.Native = new Class({
  Extends: Graph.Label.Native,
  
  initialize: function(viz) {
    this.viz = viz;
  },
  
  plotLabel: function(canvas, node, controller) {
    var indent = 5;
    var ctx = canvas.getCtx();
    var ld = controller.levelDistance - indent;
    var clone = node.pos.clone();
    clone.rho += indent;
    var p = clone.getp(true);
    var ct = clone.getc(true);
    var x = ct.x, y = ct.y;
    var measure = ctx.measureText(node.name);
    //get angle in degrees
    var pi = Math.PI;
    var cond = (p.theta > pi/2 && p.theta < 3 * pi /2);
    var thetap =  cond? p.theta + pi : p.theta;
    if(cond) {      
      x -= Math.abs(Math.cos(p.theta) * measure.width);
      y += Math.sin(p.theta) * measure.width;      
    } else if(node.id == this.viz.root) {
      x -= measure.width / 2; 
    }
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.translate(x, y);
    ctx.rotate(thetap);
    ctx.fillText(node.name, 0, 0, ld);
    ctx.restore();
  },

});

/*
   Class: Sunburst.Label.SVG

   Implements labels using SVG (currently not supported in IE).

   Extends:

   <Graph.Label.SVG>

   See also:

   <Hypertree.Label>, <Sunburst.Label>, <ST.Label>, <Hypertree>, <Sunburst>, <ST>, <Graph>.

*/
Sunburst.Label.SVG = new Class({
  Implements: Graph.Label.SVG,

  initialize: function(viz) {
    this.viz = viz;
  },

   /* 
      Method: placeLabel

      Overrides abstract method placeLabel in <Graph.Plot>.

      Parameters:

      tag - A DOM label element.
      node - A <Graph.Node>.
      controller - A configuration/controller object passed to the visualization.
     
    */
    placeLabel: function(tag, node, controller) {
        var pos = node.pos.getc(true), canvas = this.viz.canvas; 
        var radius= canvas.getSize();
        var labelPos= {
            x: Math.round(pos.x + radius.width/2),
            y: Math.round(pos.y + radius.height/2)
        };
        tag.setAttribute('x', labelPos.x);
        tag.setAttribute('y', labelPos.y);

        var bb = tag.getBBox();
        if(bb) {
          //center the label
          var x = tag.getAttribute('x');
          var y = tag.getAttribute('y');
          //get polar coordinates
          var p = node.pos.getp(true);
          //get angle in degrees
          var pi = Math.PI;
          var cond = (p.theta > pi/2 && p.theta < 3* pi /2);
          if(cond) {
            tag.setAttribute('x', x - bb.width );
            tag.setAttribute('y', y - bb.height );
          } else if(node.id == rgraph.root) {
            tag.setAttribute('x', x - bb.width/2); 
          }
          
          var thetap =  cond? p.theta + pi : p.theta;
            tag.setAttribute('transform', 'rotate('
            + thetap * 360 / (2 * pi) + ' ' + x + ' ' + y + ')');
        }

        controller.onPlaceLabel(tag, node);
  }
});

/*
   Class: Sunburst.Label.HTML

   Implements labels using plain old HTML.

   Extends:

   <Graph.Label.HTML>

   See also:

   <Hypertree.Label>, <Sunburst.Label>, <ST.Label>, <Hypertree>, <Sunburst>, <ST>, <Graph>.

*/
Sunburst.Label.HTML = new Class({
  Implements: Graph.Label.HTML,

  initialize: function(viz) {
    this.viz = viz;
  },
   /* 
      Method: placeLabel

      Overrides abstract method placeLabel in <Graph.Plot>.

      Parameters:

      tag - A DOM label element.
      node - A <Graph.Node>.
      controller - A configuration/controller object passed to the visualization.
     
    */
    placeLabel: function(tag, node, controller) {
        var pos = node.pos.getc(true), canvas = this.viz.canvas; 
        var radius= canvas.getSize();
        var labelPos= {
            x: Math.round(pos.x + radius.width/2),
            y: Math.round(pos.y + radius.height/2)
        };
        
        var style = tag.style;
        style.left = labelPos.x + 'px';
        style.top  = labelPos.y + 'px';
        style.display = this.fitsInCanvas(labelPos, canvas)? '' : 'none';
        
        controller.onPlaceLabel(tag, node);
  }
});


/*
  Class: Sunburst.Plot.NodeTypes

  Here are implemented all kinds of node rendering functions. 
  Rendering functions implemented are 'none', 'circle', 'triangle', 'rectangle', 'star' and 'square'.

  You can add new Node types by implementing a new method in this class

  Example:

  (start code js)
    Sunburst.Plot.NodeTypes.implement({
      'newnodetypename': function(node, canvas) {
        //Render my node here.
      }
    });
  (end code)

*/
Sunburst.Plot.NodeTypes = new Class({
  'none': $empty,
  //This node type is used for plotting the upper-left pie chart
  'pie': function(node, canvas) {
    var span = node.angleSpan, begin = span.begin, end = span.end;
    var polarNode = node.pos.getp(true);
    var polar = new Polar(polarNode.rho, begin);
    var p1coord = polar.getc(true);
    polar.theta = end;
    var p2coord = polar.getc(true);

    var ctx = canvas.getCtx();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p1coord.x, p1coord.y);
    ctx.moveTo(0, 0);
    ctx.lineTo(p2coord.x, p2coord.y);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, polarNode.rho, begin, end, false);
    ctx.fill();
  },
  //This node type is used for plotting the upper-right pie chart
  'multipie': function(node, canvas) {
    var ldist = this.config.levelDistance;
    var span = node.angleSpan, begin = span.begin, end = span.end;
    var polarNode = node.pos.getp(true);
    
    var polar = new Polar(polarNode.rho, begin);
    var p1coord = polar.getc(true);
    
    polar.theta = end;
    var p2coord = polar.getc(true);
    
    polar.rho += ldist;
    var p3coord = polar.getc(true);
    
    polar.theta = begin;
    var p4coord = polar.getc(true);
    
    
    var ctx = canvas.getCtx();
    ctx.beginPath();
    ctx.moveTo(p1coord.x, p1coord.y);
    ctx.lineTo(p4coord.x, p4coord.y);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, polarNode.rho, begin, end, false);
  
    ctx.moveTo(p2coord.x, p2coord.y);
    ctx.lineTo(p3coord.x, p3coord.y);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, polarNode.rho + ldist, end, begin, true);
    
    ctx.fill();
  },
  
  'gradient-multipie': function(node, canvas) {
    var ctx = canvas.getCtx();
    var radialGradient = ctx.createRadialGradient(0, 0, node.getPos().rho, 
        0, 0, node.getPos().rho + this.config.levelDistance);
    radialGradient.addColorStop(0, '#111');
    radialGradient.addColorStop(1, node.getData('color'));
    radialGradient.addColorStop(0.7, node.getData('color'));
    ctx.fillStyle = radialGradient;
    this.nodeTypes['multipie'].call(this, node, canvas);
  }
});

/*
  Class: Sunburst.Plot.EdgeTypes

  Here are implemented all kinds of edge rendering functions. 
  Rendering functions implemented are 'none', 'line' and 'arrow'.

  You can add new Edge types by implementing a new method in this class

  Example:

  (start code js)
    Sunburst.Plot.EdgeTypes.implement({
      'newedgetypename': function(adj, canvas) {
        //Render my edge here.
      }
    });
  (end code)

*/
Sunburst.Plot.EdgeTypes = new Class({
    'none': $empty,
    
    'line': function(adj, canvas) {
        var pos = adj.nodeFrom.pos.getc(true);
        var posChild = adj.nodeTo.pos.getc(true);
        canvas.path('stroke', function(context) {
            context.moveTo(pos.x, pos.y);
            context.lineTo(posChild.x, posChild.y);
        });
    },
    
    'arrow': function(adj, canvas) {
        var node = adj.nodeFrom, child = adj.nodeTo;
        var data = adj.data, econfig = this.edge;
        //get edge dim
        var cond = econfig.overridable;
        var edgeDim = adj.getData('dim');
        //get edge direction
        if(cond && data.$direction && data.$direction.length > 1) {
            var nodeHash = {};
            nodeHash[node.id] = node;
            nodeHash[child.id] = child;
            var sense = data.$direction;
            node = nodeHash[sense[0]];
            child = nodeHash[sense[1]];
        }
        var posFrom = node.pos.getc(true), posTo = child.pos.getc(true);
        var vect = new Complex(posTo.x - posFrom.x, posTo.y - posFrom.y);
        vect.$scale(edgeDim / vect.norm());
        var intermediatePoint = new Complex(posTo.x - vect.x, posTo.y - vect.y);
        var normal = new Complex(-vect.y / 2, vect.x / 2);
        var v1 = intermediatePoint.add(normal), v2 = intermediatePoint.$add(normal.$scale(-1));
        canvas.path('stroke', function(context) {
            context.moveTo(posFrom.x, posFrom.y);
            context.lineTo(posTo.x, posTo.y);
        });
        canvas.path('fill', function(context) {
            context.moveTo(v1.x, v1.y);
            context.lineTo(v2.x, v2.y);
            context.lineTo(posTo.x, posTo.y);
        });
    }
});
