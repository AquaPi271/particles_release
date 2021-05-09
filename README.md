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

## [DONE] Supernova 2D

## [DONE] Solar System 2D

## [DONE] Supernova 3D

## [DONE] Solar System 3D

[DONE] 1) Remove lines / tails.
[DONE] 2) Remove flipped orbit probability as it is meaningless now.
[DONE] 3) Add generate texture function and parameter to particle system.
[DONE] 4) Modify webgl setup.
[DONE] 5) Create perspective matrix.
[DONE] 6) Add camera controls and camera.
[DONE] 7) Modify shader and attributes.
[DONE] 8) Add buffers for texture and colors.
[DONE] 9) Add generate buffer data code
   [DONE] a) use the radius of the particle this time.
   [DONE] b) use camera transform per point.
[DONE] 10) Modify particles for 3 dimensions using glMatrix.

[DONE] At this point, test N-body system.

Possible to try but not necessary:
11) For solar system, must modify orbit calculations for 3D.
    a) Fix up generate_random_particle() with the following:
       1) Random direction is vector in tangent plane.
       2) Use sphere / BB method.  Find intersection to this point in tangent plane.
          Create vector from tangent point to this point.  Normalize it.
       3) Use glMatrix library.

[DONE] 12) Clean up dead code that has been commented.

