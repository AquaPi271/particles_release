# Description:

I am interested in one or two ideas for particle systems.  The first idea is to create an N-body system where particles are attracted or repulsed depending on interactions.  For example, a gravity or magnetic system could be modeled.  Another particle system idea is to render a particle special effect not related to N-body systems.  As a review, particle systems generally observe the following:

- Define a number of small objects, sometimes extremely large.
- Objects are spawned at a regular rate.
- The behave in a simple manner.
- Behavior can be different from object to object.
- The objects are removed from the system at a regular rate.

The systems I implement observed all or most of these points.  The N-body system deviates a little because it spawns everything at once and only removes objects from the system if they collide (and collision detection is active).  If a collision occurs the particles are merged to form a new object that preserves "momentum".  Hence, there is a spawn rate of sorts.

For the supernova effect all points above are observed.

---------------------------------------------------------------------------------------

Here are the components I planned to implement in the assignment.  This project implements the first 5 components but does not implement the extra credit.

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

## Solar System / N-body 2D (index_nbody2d.html)

This will render a 2D representation of N-body interactions.  Two setups will be provided:

1) Simulate a miniature solar system that starts with a central mass and has orbiting bodies.  Technically this is still an N-body simulation.
2) Simulate an N-body system with no central mass.

In both cases, options for collision detection (and merge) and a line tracing effect are available.  Additionally controls are availabe to modify the distribution of radius, for example.  The line tracing effect can adjust the number of points added.  Other possible controls are available for G, time_step, and eccentricity.

To use the panel from the webpage first select the start condition preset as either 'Solar System' or 'Random N-Body'.

Next under the start settings adjust the sliders to vary initial conditions.  Particle count and path size apply to both start setups.  However, 'Flipped Orbit Probability', 'Orbit Eccentricity', and 'Orbit Radius' only apply to the 'Solar System'.

'Particle Count' selects the total number of starting particles.
'Path Size' selects the total length of the path traced by each particle (its history).
'Flipped Orbit Probability' gives the probability that an object will orbit the Sun clockwise or counter-clockwise.
'Min. / Max. Orbit Eccentricity' controls the range of how much an object's starting orbit deviates for circular.
'Min. / Max. Orbit Radius' controls the range of how far objects can be from the Sun.

To run the simulation click the 'Start Simulation' button.  This will generate a graphical canvas showing the simulation.

The remaining buttons are available for run time and will effect these simulation parameters as it runs.

I created two 'G', universal gravity constants for 'N-Body' or 'Solar System'.  I found defaults were different for each to show interesting behavior.  Only the appropriate G slider matches the currently selected simulation.  The greater the G value, the stronger the overly force of gravity is.

'Delta Time' controls the time step of the simulation.  Sliding right will slow things down, while left will speed it up.  The larger the step, the "less accurate" the interactions are, although I found it hard to notice.

Finally there are two checkboxes that can affect behavior at run time:

'Collisions' when checked will allow collisions to be detected.  When a collision occurs, collided objects will be merged with preseved momentum.  Unchecking this box will return to no collision detection behavior.

'Draw Paths', when checked, will show a history of the particle's path.  The quicker an object moves, the longer the path it will have.

Finally, to restart a simulation, click 'End Simulation', adjust settings, and hit 'Start Simulation' to create a new one.

Implementation Details:

This feature was accomplished with a WebGL shader using points for the particles and lines for the history paths.  Objects are rendered directly in the z = 0 plane from x=[-1,1] and y=[-1,1].  This corresponds to the "cube" WebGL expects for rendering.  In theory, the canvas size settings could change to reflect a new simulation window.

## Solar System / N-body 3D (index_nbody3d.html)

This will duplicate the 2D version of the solar system but in 3D.  Billboarding with screen aligned sprites is used to render the masses.  Camera controls are available to change the view perspective.  However, linear trail effects are removed as they did not work well in 3D rendering.

The controls operate the same as the 2D version, so look above.  Keep in mind that 'Path Size' and 'Draw Paths' have been removed.

However, camera controls have been added.  Below the panel is text describing the key mappings for the camera operations.

Implementation Details:

A camera has been introduced.  To make the particles seems more 'real', a texture of a circle is used to show each particle.  A full 3D rendered object is not used as it would consume too much compute resource.  Instead, 3D billboards are used and screen aligned, to give the impression of 3D spheres.  With perspective camera, the illusion is pretty good.  Since WebGL does not contain any geometry shaders, each particle is transformed by the camera matrix, outside of the GPU.  There two triangles that form a square based on particle radius side is built.  These are sent to the GPU where it renders texture, color, and perspection / projection transforms.

## Supernova 2D (index_supernova2d.html)

A "super-nova" will randomly emit particles starting from a circular pattern and emanate outwards.  They will deccelerate.  When they have too little speed, they will die.  Controls include particle per shell, shell frequency rate, decceleration parameter, initial speed, and positioning of the effect with the mouse.

The controls are as follows and are all observed in realtime:

'Particle Size' controls how big all the particles are.  To the right is bigger.
'Shell Emission Probability' controls how frequently a new circle of particles is generated.  Sliding to the right increases the rate.
'Particles Per Shell Max.' indicates the maximum number of particles per shell.  A random number are created an uniformly selected up to this limit.  Sliding to the right increases the maximum that can appear.  Note that the system seems to handle a very large number of particles.
'Initial Speed' When particles are generated, they are sent in a random direction at an initial velocity.  A larger initial speed will allow the particle to live longer and travel further.
'Decceleration' controls how quickly particles slow down.  This also effects the lifetime of the particle.

Finally, clicking the mouse in the canvas will change the emitter point.

Implementation Details:

Like the 2D N-body, the particles are created with points.  Colors are selected randomly for an entire layer.  Color and vertex buffers grow dynamically to handle increases in maximum particle capacity.  I've found the simulation can handle upwards of a half million particles.

## Supernova 3D (index_supernova3d.html)

Like the 2D version but will billboard the particles in 3D.  Camera controls are available.  Left clicking the mouse does not change the emitter location.  I didn't find a good way to change this click from a 2D to 3D space.

The controls are identical to the 2D version except the left-mouse clicking.

Camera controls have been added and are listed in the HTML pane.

Implementation Details:

Screen aligned billboarding is done exactly the same as the 3D N-Body system.  The main difference is that a particle can emit to a third dimension.