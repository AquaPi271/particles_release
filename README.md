# Description:

I am interested in one or two ideas for particle systems.  I tend to be a little optimistic so was hoping to get feedback about what seems reasonable based on prior projects.  The first idea is to create an N-body system where particles are attracted or repulsed depending on interactions.  For example, a gravity or magnetic system could be modeled.  

## Component 1:

Render particles that interact via some attraction rule such as gravity or magnetism.  Allow for a premade "solar" system setup.

## Component 2:

Render on a 3D projection with camera controls or in a texture.  Give particles a lifetime.

## Component 3:

Objects that attract can merge making a larger object.  Takes on characteristics of combined objects somehow (momentum).  Collision detection.

## Component 4:

Allow the particle emitter to be configured.  For example, a "super-nova" effect could emit particles in a spherical shell.  A "quasar" might emit in a cone.  Experiment with other patterns here.

## Component 5:

Add another effect possibly one of these:  1)  Have particles maintain a "history" by allowing tracing of particle paths for X number of frames (perhaps on the larger objects).  2)  Place "wormholes" that transport particles instantaneously to another part of the world.  3)  Add obstacles that deflect particle paths.

## Extra Credit:

Attempt computations mostly or nearly wholly on GPU via TransformFeedbacks.  Experiment with how many more particles can be added.

---------------------------------------------------------------------------------------

# Release Components

Rather than placing all components in one webpage, they will be broken up into the following to demonstrated the effects.  Load the appropriate HTML to run the corresponding code.

## Solar System / N-body 2D

This will render a 2D representation of N-body interactions.  Two setups will be provided:

1) Simulate a minature solar system that starts with a central mass and has orbiting bodies.  Technically this is still an N-body simulation.
2) Simulate an N-body system with no central mass with configuration options.

In both cases, options for collision detection (and merge) and a line tracing effect are available.  Additionally controls are availabe to modify the distribution of mass and radius, for example.  The line tracing effect can adjust the number of points added.  Other possible controls are available for G, time_step, and epsilon.

## Solar System / N-body 3D

This will duplicate the 2D version of the solar system but in 3D.  Billboarding with screen aligned sprites will be used to render the masses.  Camera controls are available to change the view perspective.  However, linear trail effects are removed.

## Supernova 2D

A "super-nova" will randomly emit particles starting from a circular pattern and emanate outwards.  They will deccelerate.  When they have too little speed, they will die.  Controls include particle per shell, shell frequency rate, decceleration parameter, initial speed, and positioning of the effect with the mouse.

## Supernova 3D

Like the 2D version but will billboard the particles in 3D.  Camera controls are available.  Positioning will be removed (for now).

# TODO:

Go from easiest to hardest.

Branches from old repo the are the most relevant:

1) basic_3d -- Billboarding implementation with glMatrix.
2) random_ssclc_supernova -- 2D supernova with color
3) random_sscl_color -- 2D N-body / solar system with lines, color, collision
4) remainder are earlier versions

## Supernova 2D

## Supernova 3D

## Solar System 2D

## Solar System 3D


