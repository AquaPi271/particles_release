var run_flag = false;

var collision_detection = false;
var collision_setting;
var simulate_n_body = true;

var sun_color = [1.0, 1.0, 0.0];
var particle_color = [0.0, 1.0, 1.0];

const mode_points = 1;
const mode_lines = 2;

// Gravity system parameters.
var particle_count = 300;

var G = 1.0;  // barely any gravity
var epsilon = 0.000000001;
var g_delta_t = 0.00005;  // time step


var G_n_body = 1.0;
//var epsilon_n_body = 0.01;
var epsilon_n_body = 0.001;
var g_delta_t_n_body = 0.00005;  // time step

var G_solar_system = 1.0;
var epsilon_solar_system = 0.00000001;
var g_delta_t_solar_system = 0.00005;  // time step

var sun_mass = 40000.0;
//var sun_radius = 1.0/512.0;
var sun_radius = 0.04;

var min_orbital_radius = 0.3;  // anything past 1.0 may not be visible
var max_orbital_radius = 0.8;

var min_eccentricity = 0.8;  // > 0 
var max_eccentricity = 1.0;  // > 0  

var min_mass = 0.01;  // too heavy relative to Sun will de-stablize Sun
var max_mass = 0.1;

//var min_radius = 1/512.0;
//var max_radius = 1.001/512.0;

var min_radius = 0.001;
var max_radius = 0.02;

var flipped_orbit_probability = 0.1;

var n_body_min_x = -1.0;
var n_body_max_x = 1.0;
var n_body_min_y = -1.0;
var n_body_max_y = 1.0;
var n_body_min_z = -1.0;
var n_body_max_z = 1.0;
var n_body_min_mass = 10.0;
var n_body_max_mass = 100.0;
//var n_body_min_radius = 0.001;
//var n_body_max_radius = 0.001;
var n_body_min_radius = 0.001;
var n_body_max_radius = 0.02;

// var n_body_min_x = -0.1;
// var n_body_max_x = 0.1;
// var n_body_min_y = -0.5;
// var n_body_max_y = 0.5;
// var n_body_min_mass = 10.0;
// var n_body_max_mass = 100.0;

// Graphics

var canvas = null;
var gl = null;
var vec4_clear_color          = vec4.fromValues( 0.0, 0.0, 0.0, 1.0 );  // color for clearing canvas
var shader_program = null;

// Shader variables

var attr_vertex_position      = null;                                   // attribute to vertex buffer
var uniform_projection_matrix = null;
var attr_vertex_uv            = null;
var uniform_texture           = null;
var attr_color                = null;

// Projection and camera

var camera                    = null;
var camera_move_increment     = 0.03;
var camera_angle_increment    = 6.0;

var camera_start_location     = [0.0, 0.0, 1.0];
var camera_start_forward      = [0.0, 0.0, -1.0];
var camera_start_right        = [1.0, 0.0, 0.0];
var camera_start_up           = [0.0, 1.0, 0.0];

var mat4_projection_matrix    = mat4.create();
var near_clip_plane_distance  = 0.1;
var far_clip_plane_distance   = 10.0;

// Global particle system object.

var particle_system = null;



//mat4.perspective(projection_matrix, 0.5 * Math.PI, canvas.width/canvas.height, near_clip_plane_distance, far_clip_plane_distance );

// Universal Law of Gravitation:
//
// Fg = G * m1 * m2 / (r * r)
//
// G = 6.67430 x 10^-11 (N * m * m) / (kg * kg)

// 
// 
// Fsun_earth = G * Mearth * Msun / (r*r)
//            = 6.67430 x 10^-11 * 5.9720 * 10^24 kg * 1.9891 * 10^30 kg / (149.6 * 10^9 m)^2
//            = 3.5425742 x 10^22 N
//            
// Asun       = 3.5425742 x 10^22 N / 1.9891 * 10^30 kg = 1.78e-8 m/ss (negligible)
// Aearth     = 3.5425742 x 10^22 N / 5.9720 * 10^24 kg  = 0.00593 m/ss
//
// Vearth_tan:  a = v*v/r, v = sqrt(a*r) = sqrt(0.00593 m/ss * 149.6 * 10^9m) = 29784 m/s
//                   Mass               Distance to Sun
//   Sun      = 1.9891 * 10^30 kg
//   Mercury
//   Venus    = 4.8670 * 10^24 kg
//   Earth    = 5.9720 * 10^24 kg        149.6 * 10^9 m
//   Mars     = 6.3900 * 10^23 kg
//   Jupiter  = 1.8980 * 10^27 kg
//   Saturn
//   Uranus
//   Neptune
//   Pluto
//   Asteroid

class Particle {
    constructor(
        x,
        y,
        z,
        vx,
        vy,
        vz,
        mass,
        radius,
        color,
        fixed_pos = false
    ) {
        
        this.vec3_position = vec3.fromValues( x, y, z );
        this.vec3_velocity = vec3.fromValues( vx, vy, vz );
        this.vec3_acceleration = vec3.fromValues( 0.0, 0.0, 0.0 );

        this.mass = mass;
        this.fixed_pos = fixed_pos;
        this.color = color.slice();
        this.radius = radius;
    }

    clone( ) {
        var particle = new Particle(this.vec3_position[0], this.vec3_position[1], this.vec3_position[2], 
                                    this.vec3_velocity[0], this.vec3_velocity[1], this.vec3_velocity[2], 
                                    this.mass, this.radius, this.color, this.fixed_pos);
        particle.vec3_acceleration = vec3.clone(this.vec3_acceleration);
        return( particle );
    }

    reset_acceleration( ) {
        vec3.set( this.vec3_acceleration, 0.0, 0.0, 0.0 );
    }

    interact( other_particle, bidirectional = true ) {
        var r2 = vec3.squaredDistance( this.vec3_position, other_particle.vec3_position );
        var r = Math.sqrt(r2);
        var collided = (other_particle.radius + this.radius) > r;
        if( collided ) {
            if( collision_detection ) {
                return( true );
            }
        }
        if( r2 < epsilon ) {
            r2 += epsilon;
        }
        var F = G * this.mass * other_particle.mass / r2;
        var rm1 = 1.0/r; 
        var a_this = F / this.mass;
        var a_other_particle = F / other_particle.mass;
        var pos_diff_other_to_this = vec3.create();
        var pos_diff_this_to_other = vec3.create();
        vec3.sub( pos_diff_other_to_this, other_particle.vec3_position, this.vec3_position );
        vec3.sub( pos_diff_this_to_other, this.vec3_position, other_particle.vec3_position );

        vec3.scaleAndAdd( this.vec3_acceleration, this.vec3_acceleration, pos_diff_other_to_this, a_this * rm1 );    
        vec3.scaleAndAdd( other_particle.vec3_acceleration, other_particle.vec3_acceleration, pos_diff_this_to_other, a_other_particle * rm1 );         

        return ( false ); // return collision boolean
    }
 
    update( delta_t ) {
        if( !this.fixed_pos ) {
            vec3.scaleAndAdd( this.vec3_velocity, this.vec3_velocity, this.vec3_acceleration, delta_t );
            vec3.scaleAndAdd( this.vec3_position, this.vec3_position, this.vec3_velocity, delta_t );
        }
    }

    static generate_random_particle(sun_x, sun_y, sun_z, sun_mass, radius_min, radius_max, eccen_min, eccen_max, mass_min, mass_max) {
        var radius = (radius_max-radius_min) * Math.random() + radius_min;
        var angle  = (2*Math.PI) * Math.random();
        var eccen  = (eccen_max - eccen_min) * Math.random() + eccen_min;
        var mass   = (mass_max - mass_min) * Math.random() + mass_min;

        var circular_tangent_velocity = Math.sqrt( G * sun_mass / radius ) * eccen;
        // Point on circle is:
        var px = radius * Math.cos(angle);
        var py = radius * Math.sin(angle);
        // Tangent vector is:
        var diff_x = px - sun_x;
        var diff_y = py - sun_y;
        // TODO: Does not handle 3D yet.
        var line_dir_x = -1.0 * diff_y;
        var line_dir_y = diff_x;
        if( Math.random() < flipped_orbit_probability ) {
            line_dir_x *= -1.0;
            line_dir_y *= -1.0;
        }
        var vec_length = Math.sqrt((line_dir_x**2) + (line_dir_y**2));
        line_dir_x = line_dir_x / vec_length;
        line_dir_y = line_dir_y / vec_length;
        var vx = circular_tangent_velocity * line_dir_x;
        var vy = circular_tangent_velocity * line_dir_y;
        var radius = Particle.compute_radius( mass_min, mass_max, mass, min_radius, max_radius );

        var particle = new Particle(px, py, 0.0, vx, vy, 0.0, mass, radius, particle_color);
        return( particle );
    }

    static generate_n_body_particle(min_x, max_x, min_y, max_y, min_z, max_z, mass_min, mass_max ) {

        var px   = (max_x - min_x) * Math.random() + min_x;
        var py   = (max_y - min_y) * Math.random() + min_y;
        var pz   = (max_z - min_z) * Math.random() + min_z;
        var mass   = (mass_max - mass_min) * Math.random() + mass_min;
        var radius = Particle.compute_radius( mass_min, mass_max, mass, n_body_min_radius, n_body_max_radius );

        var particle = new Particle(px, py, pz, 0.0, 0.0, 0.0, mass, radius, particle_color );
        return( particle );
    }

    static compute_radius( mass_min, mass_max, mass, min_radius, max_radius ) {
        if( mass > mass_max ) {
            mass = mass_max;
        }
        if( mass < mass_min ) {
            mass = mass_min;
        }
        var m = (max_radius - min_radius) / (mass_max - mass_min);
        var r = m * (mass - mass_min) + min_radius;
        return( r );
    }

}

class ParticleSystem {
    constructor(
        gl,
        particle_count, 
        particle_texture
    ) {
        this.particle_count = particle_count;

        this.sprite_gl_buffer       = gl.createBuffer();   // GL buffer object for vertices
        this.sprite_gl_uv_buffer    = gl.createBuffer();   // GL buffer object for UV coordinates
        this.sprite_gl_color_buffer = gl.createBuffer();   // GL buffer object for sprite color

        this.sprite_vertex_buffer  = new Float32Array(this.particle_count * 2 * 3 * 3);  // Holds sprite vertices
        this.sprite_uv_buffer      = new Float32Array(this.particle_count * 2 * 3 * 2);  // Hold sprite texture coordinates
        this.sprite_color_buffer   = new Float32Array(this.particle_count * 2 * 3 * 3);  // Hold sprite colors to be use

        this.particles = [];

        this.sprite_texture = particle_texture;
    }

    add_particle( particle ) {
        if( this.particles.length >= this.particle_count ) {
            return(false);
        }
        this.particles.push( particle.clone() );
        return(true);
    }

    update_sprite_vertices_from_point( vec4_point, color, index, uv_index, color_index, particle_radius ) {

        // Make a square from two rectangles and place a Z=0 for now.
    
        var radius = particle_radius;
    
        var UL = vec3.fromValues( -1.0 * radius + vec4_point[0],        radius + vec4_point[1], vec4_point[2] );
        var UR = vec3.fromValues(        radius + vec4_point[0],        radius + vec4_point[1], vec4_point[2] );
        var LL = vec3.fromValues( -1.0 * radius + vec4_point[0], -1.0 * radius + vec4_point[1], vec4_point[2] );
        var LR = vec3.fromValues(        radius + vec4_point[0], -1.0 * radius + vec4_point[1], vec4_point[2] );
    
        var UL_uv = vec2.fromValues( 0.0, 1.0 );
        var UR_uv = vec2.fromValues( 1.0, 1.0 );
        var LL_uv = vec2.fromValues( 0.0, 0.0 );
        var LR_uv = vec2.fromValues( 1.0, 0.0 );
    
        // First triangle.

        this.sprite_vertex_buffer[index++] = UL[0];  this.sprite_uv_buffer[uv_index++] = UL_uv[0];  
        this.sprite_vertex_buffer[index++] = UL[1];  this.sprite_uv_buffer[uv_index++] = UL_uv[1];
        this.sprite_vertex_buffer[index++] = UL[2];
        this.sprite_vertex_buffer[index++] = UR[0];  this.sprite_uv_buffer[uv_index++] = UR_uv[0];
        this.sprite_vertex_buffer[index++] = UR[1];  this.sprite_uv_buffer[uv_index++] = UR_uv[1];
        this.sprite_vertex_buffer[index++] = UR[2];
        this.sprite_vertex_buffer[index++] = LL[0];  this.sprite_uv_buffer[uv_index++] = LL_uv[0];
        this.sprite_vertex_buffer[index++] = LL[1];  this.sprite_uv_buffer[uv_index++] = LL_uv[1];
        this.sprite_vertex_buffer[index++] = LL[2];  
    
        // Second triangle.
        
        this.sprite_vertex_buffer[index++] = UR[0];  this.sprite_uv_buffer[uv_index++] = UR_uv[0];
        this.sprite_vertex_buffer[index++] = UR[1];  this.sprite_uv_buffer[uv_index++] = UR_uv[1];
        this.sprite_vertex_buffer[index++] = UR[2];
        this.sprite_vertex_buffer[index++] = LR[0];  this.sprite_uv_buffer[uv_index++] = LR_uv[0];
        this.sprite_vertex_buffer[index++] = LR[1];  this.sprite_uv_buffer[uv_index++] = LR_uv[1];
        this.sprite_vertex_buffer[index++] = LR[2];
        this.sprite_vertex_buffer[index++] = LL[0];  this.sprite_uv_buffer[uv_index++] = LL_uv[0];
        this.sprite_vertex_buffer[index++] = LL[1];  this.sprite_uv_buffer[uv_index++] = LL_uv[1];
        this.sprite_vertex_buffer[index++] = LL[2];
    
        // Color is just repeating pattern.

        for( var c = 0; c < 6; ++c ) {
            this.sprite_color_buffer[color_index++] = color[0];
            this.sprite_color_buffer[color_index++] = color[1];
            this.sprite_color_buffer[color_index++] = color[2];
        }
        return( [index, uv_index, color_index] );
    }

    draw( gl ) {
        // Iterate through each particle point and apply camera transform to it to get
        // camera via.  Create sprite vertices from this location.  Also must add color.
        // Add texture coordinates.  Draw.
        var vertex_index = 0;
        var uv_index = 0;
        var color_index = 0;
        var vec4_transformed_point = vec4.create();   
        var camera_matrix = camera.get_camera_matrix();

        for( var i = 0; i < this.particles.length; ++i ) {
            var particle = this.particles[i];
            var vec3_position = particle.vec3_position;
            
            vec4.transformMat4( vec4_transformed_point, vec4.fromValues(vec3_position[0], vec3_position[1], vec3_position[2], 1.0), camera_matrix );        
            var indices = this.update_sprite_vertices_from_point( vec4_transformed_point, particle.color, vertex_index, uv_index, color_index, particle.radius );
            
            vertex_index = indices[0];
            uv_index     = indices[1];
            color_index  = indices[2];
        }
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sprite_texture);
        gl.uniform1i(uniform_texture, 0);
    
        gl.uniformMatrix4fv(uniform_projection_matrix, false, mat4_projection_matrix);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sprite_gl_uv_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sprite_uv_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attr_vertex_uv,2,gl.FLOAT,false,0,0);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sprite_gl_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sprite_vertex_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attr_vertex_position,3,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sprite_gl_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sprite_color_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attr_color,3,gl.FLOAT,false,0,0);
    
        gl.drawArrays(gl.TRIANGLES,0,6*this.particles.length);
    }

    update( delta_t ) {
        var collision_dict = {};
        for( var p = 0; p < this.particles.length; ++p ) {
            // Reset for this round of acceleration.
            this.particles[p].reset_acceleration();
        }
        // Painful N^2 loop.
        for( var m = 0; m < this.particles.length-1; ++m ) {
            var particle_m = this.particles[m];
            for( var n = m+1; n < this.particles.length; ++n ) {
                var collide = particle_m.interact(this.particles[n]);
                if( collide && collision_detection ) {
                    if( m in collision_dict ) {
                        collision_dict[m].outstanding[n] = 1;
                    } else {
                        collision_dict[m] = {"outstanding" : {}, "merged" : {}};
                        collision_dict[m].outstanding[n] = 1;
                        collision_dict[m].merged[m] = 1;
                    }
                    if( n in collision_dict ) {
                        collision_dict[n].outstanding[m] = 1;
                    } else {
                        collision_dict[n] = {"outstanding" : {}, "merged" : {}};
                        collision_dict[n].outstanding[m] = 1;
                        collision_dict[n].merged[n] = 1;
                    }
                }
            }
        }
        if( collision_detection && Object.keys(collision_dict).length > 0 ) {
            this.resolve_collisions( collision_dict );
            var delete_particle_indices = Object.keys(collision_dict);
            var merged_particles = [];
            for( var co_key in collision_dict ) {
                var merge_list = Object.keys(collision_dict[co_key].merged);
                if( merge_list.length > 1 ) {
                    merged_particles.push( this.merge_particles( merge_list ) );
                }
            }

            this.delete_particles( delete_particle_indices );

            for( var m = 0; m < merged_particles.length; ++m ) {
                this.particles.push( merged_particles[m] );
            }
        }

        // Update positions
        for( var m = 0; m < this.particles.length; ++m ) {
            this.particles[m].update(delta_t);
        }
    }

    delete_particles( delete_indices ) {
        delete_indices.sort(function(a,b) {
            return b - a;
        });
        for( var di = 0; di < delete_indices.length; ++di ) {
            this.particles.splice(delete_indices[di],1);
        }
    }

    merge_particles( merge_list ) {
        var mass_sum = 0.0;
        var merge_count = merge_list.length * 1.0;
        var vec3_new_position = vec3.fromValues(0.0, 0.0, 0.0);
        var merge_with_sun = false;
        for( var pi = 0; pi < merge_list.length; ++pi ) {
            var p = merge_list[pi];
            if( (this.particles[p].color[0] == sun_color[0]) && 
                (this.particles[p].color[1] == sun_color[1]) && 
                (this.particles[p].color[2] == sun_color[2]) ) {
                    merge_with_sun = true;
            }
            mass_sum += this.particles[p].mass;
            vec3.add( vec3_new_position, vec3_new_position, this.particles[p].vec3_position );
        }
        vec3.scale( vec3_new_position, vec3_new_position, 1.0 / merge_count );
        var vec3_new_velocity = vec3.fromValues(0.0, 0.0, 0.0);
        for( var pi = 0; pi < merge_list.length; ++pi ) {
            var p = merge_list[pi];
            var mass_fraction = this.particles[p].mass/mass_sum;
            vec3.scaleAndAdd( vec3_new_velocity, vec3_new_velocity, this.particles[p].vec3_velocity, mass_fraction );
        }

        var radius = null;
        if( simulate_n_body ) {
            radius = Particle.compute_radius(n_body_min_mass, n_body_max_mass, mass_sum, n_body_min_radius, n_body_max_radius);
        } else {
            radius = Particle.compute_radius(min_mass, max_mass, mass_sum, min_radius, max_radius);
        }
        var color = particle_color;
        if( merge_with_sun ) {
            color = sun_color;
            radius = sun_radius;
        }
        var particle = new Particle( vec3_new_position[0], vec3_new_position[1], vec3_new_position[2],  
                                     vec3_new_velocity[0], vec3_new_velocity[1], vec3_new_velocity[2],
                                     mass_sum, radius, color );
        return( particle );
    }

    print_collision_dict( collision_dict ) {
        var key_list = Object.keys(collision_dict);
        key_list.sort( function( a, b ) { return( a - b ); } );
        for( var i = 0; i < key_list.length; ++i ) {
            var co_key = key_list[i];
            console.log( co_key + " -> outstanding [ " + Object.keys(collision_dict[co_key].outstanding) + 
                         " ] : merged [ " + Object.keys(collision_dict[co_key].merged) + " ] " );
        }
    }

    resolve_collisions( collision_dict ) {
        //this.print_collision_dict( collision_dict);
        //console.log(" ======== ");
        var key_list = Object.keys(collision_dict);
        key_list.sort( function( a, b ) { return( a - b ); } );

        if( key_list.length == 0 ) {
            return;
        }

        var key_list_index = 0;
        var current_merge = null;
        var current_outstanding = null;
        while( key_list_index < key_list.length ) {
            current_merge = key_list[key_list_index];
            var outstanding_keys = Object.keys(collision_dict[current_merge].outstanding);
            if( outstanding_keys.length == 0 ) {  // No merges outstanding.
                ++key_list_index;
                continue;
            }
            // Get an element from outstanding keys.
            current_outstanding = outstanding_keys[0];
            // Get current_outstanding's merged dict and merge into current_merge merge list.
            for( var co_key in collision_dict[current_outstanding].merged ) {
                collision_dict[current_merge].merged[co_key] = 1;
            }
            // Place current_outstanding's outstanding keys and place into current_marge outstanding keys,
            // except if the key is either current_merge or current_outstanding merage.
            for( var co_key in collision_dict[current_outstanding].outstanding ) {
                if( !((co_key == current_merge) || (co_key == current_outstanding)) ) {
                    collision_dict[current_merge].outstanding[co_key] = 1;
                }
            }

            // Delete current_outstanding's outstanding dict. (set to empty dict, actually)
            collision_dict[current_outstanding].outstanding = {};

            // Visit all other collision_dicts outstanding and replace current_outstanding with current_merge.
             
            for( var i = 0; i < key_list.length; ++i ) {
                var co_key = key_list[i];
                if( co_key != current_merge ) {
                    if( current_outstanding in collision_dict[co_key].outstanding ) {
                        collision_dict[co_key].outstanding[current_merge] = 1;
                        delete( collision_dict[co_key].outstanding[current_outstanding] );
                    }
                }
            }

            // Remove current_outstanding from current_merge's outstanding.
            delete( collision_dict[current_merge].outstanding[current_outstanding] );
        }
    }
}

function setup_webgl() {

    // Set up keys
    document.onkeydown = handle_key_down; // call this when key pressed

    canvas = document.getElementById("myWebGLCanvas");
    gl = canvas.getContext("webgl");
    try {
        if( gl == null ) {
            throw "unable to get the webgl context from the browser page";
        } else {
            gl.clearColor( vec4_clear_color[0], vec4_clear_color[1], vec4_clear_color[2], vec4_clear_color[3] );
            gl.clearDepth( 1.0 );
            gl.enable( gl.DEPTH_TEST );
        }
    }
    
    catch(e) {
        console.log(e);
    }

    mat4.perspective(mat4_projection_matrix, 0.5 * Math.PI, canvas.width/canvas.height, near_clip_plane_distance, far_clip_plane_distance );
}

function setup_shaders() {

    // define vertex shader in essl using es6 template strings
    var vertex_shader_source = `
        attribute vec3 attr_vertex_position; // vertex position
        attribute vec2 attr_vertex_uv;       // vertex texture uv
        attribute vec3 attr_color;           // sprite color

        uniform mat4 uniform_projection_matrix;   // projection matrix only (for billboarding must run camera outside of shader) 

        varying vec2 vary_vertex_uv;         // interpolated uv for frag shader
        varying vec3 vary_color_rgb;

        void main(void) {
    
            // vertex position

            gl_Position = uniform_projection_matrix * vec4(attr_vertex_position, 1.0);

            // vertex uv

            vary_vertex_uv = attr_vertex_uv;

            // pass color to framgment shader

            vary_color_rgb = attr_color;
        }
    `;

    // define fragment shader in essl using es6 template strings
    var fragment_shader_source = `
        precision mediump float; // set float to medium precision
        
        // texture properties
        varying vec3 vary_color_rgb;
        uniform sampler2D uniform_texture; // the texture for the fragment
        varying vec2 vary_vertex_uv; // texture uv of fragment
            
        void main(void) {
            vec4 tex_color = texture2D(uniform_texture, vec2(vary_vertex_uv.s, vary_vertex_uv.t));
            gl_FragColor = tex_color * vec4(vary_color_rgb, 1.0);
        } // end main
    `;

    // Compile and link the shaders.
    try {
        var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertex_shader, vertex_shader_source);
        gl.compileShader(vertex_shader);

        var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragment_shader, fragment_shader_source);
        gl.compileShader(fragment_shader);

        if( !gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
            throw "vertex shader compiler failure: " + gl.getShaderInfoLog(vertex_shader);
        } else if( !gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
            throw "fragment shader compiler failure: " + gl.getShaderInfoLog(fragment_shader);
        } 

        shader_program = gl.createProgram();
        gl.attachShader(shader_program, vertex_shader);
        gl.attachShader(shader_program, fragment_shader);
        gl.linkProgram(shader_program);

        if( !gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
            throw "error when linking shader program: " + gl.getProgramInfoLog(shader_program);
        }

        gl.useProgram( shader_program );
        attr_vertex_position = gl.getAttribLocation(shader_program, "attr_vertex_position");
        gl.enableVertexAttribArray(attr_vertex_position);
        attr_vertex_uv = gl.getAttribLocation(shader_program, "attr_vertex_uv");
        gl.enableVertexAttribArray(attr_vertex_uv);
        attr_color = gl.getAttribLocation(shader_program, "attr_color");
        gl.enableVertexAttribArray(attr_color);

        // Get the uniform variables from the shaders

        uniform_projection_matrix = gl.getUniformLocation(shader_program, "uniform_projection_matrix"); 
        uniform_texture = gl.getUniformLocation(shader_program, "uniform_texture");
    }

    catch(e) {
        console.log(e);
    }
}

function render_scene( ) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);

    particle_system.update(g_delta_t);
    particle_system.draw(gl);

    collision_detection = collision_setting;

    if( run_flag ) {
        window.requestAnimationFrame(render_scene);
    }
}

function generate_mass_texture( gl ) {

    // Make a simple circle for now.  Possible include gradient later.
    // Empty spots must be fully transparent.

    var mass_texture = gl.createTexture();
    var width = 64;   
    var height = 64;  
    var data = [];
    var data2D = new Array(width);
    var circle_color = [255,255,255,255];
    
    for( var y = 0; y < height; ++y ) {
	    data2D[y] = new Array(height);
    }

    // Initialize to fully transparent black.
    
    for( var y = 0; y < height; ++y ) {
	    for( var x = 0; x < width; ++x ) {
	        data2D[x][y] = [0,0,0,0];
	    }
    }

    // Draw circle.
    
    var mid_y = height / 2.0;
    var mid_x = width / 2.0;

    for( var y = 0; y < height; ++y ) {
        for( var x = 0; x < width; ++x ) {
            var distance_squared = (x - mid_x)**2 + (y - mid_y)**2;
            if( distance_squared < 32.0 * 32.0 ) {
                data2D[x][y] = circle_color;
            }
        }
    }

    // Flatten elements into RGBA quads.
    
    for( var y = 0; y < height; ++y ) {
	    for( var x = 0; x < width; ++x ) {
	        var ele = data2D[x][y];
	        data.push( ele[0] );
	        data.push( ele[1] );
	        data.push( ele[2] );
	        data.push( ele[3] );
	    }
    }
    var data_typed = new Uint8Array(data);
    gl.bindTexture(gl.TEXTURE_2D, mass_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data_typed);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return( mass_texture );
}

function attach_controls() {
    var simulation_type_radio = document.getElementsByName("start_condition");
    for( var i = 0; i < simulation_type_radio.length; ++i ) {
        if( simulation_type_radio[i].checked ) {
            if( simulation_type_radio[i].value == "solar_system" ) {
                simulate_n_body = false;
            } else if( simulation_type_radio[i].value == "nbody" ) {
                simulate_n_body = true;
            }
        }
    }
    var particle_count_slider = document.getElementById("particle_count_range");
    particle_count = parseInt(particle_count_slider.value);

    var counter_probability_slider = document.getElementById("counter_probability_range");
    flipped_orbit_probability = parseFloat(counter_probability_slider.value) / 100.0;

    var min_eccen_slider = document.getElementById("min_eccen_range");
    min_eccentricity = parseInt(min_eccen_slider.value) * 1.0 / 10.0;

    var max_eccen_slider = document.getElementById("max_eccen_range");
    max_eccentricity = parseInt(max_eccen_slider.value) * 1.0 / 10.0;

    if( max_eccentricity < min_eccentricity ) {
        max_eccentricity = min_eccentricity;
    }  
    
    var min_orbit_slider = document.getElementById("min_orbit_range");
    min_orbital_radius = parseInt(min_orbit_slider.value) * 1.0 / 20.0;

    var max_orbit_slider = document.getElementById("max_orbit_range");
    max_orbital_radius = parseInt(max_orbit_slider.value) * 1.0 / 20.0;

    if( max_orbital_radius < min_orbital_radius ) {
        max_orbital_radius = min_orbital_radius;
    } 

    var g_solar_slider = document.getElementById("G_solar_range");
    if( !simulate_n_body ) {
        G = g_solar_slider.value * 1.0;
    }
    g_solar_slider.oninput = function() {
        if( !simulate_n_body ) {
            G = this.value * 1.0;
        }
    }
    var g_nbody_slider = document.getElementById("G_nbody_range");
    if( simulate_n_body ) {
        G = g_nbody_slider.value * 1.0;
    }
    g_nbody_slider.oninput = function() {
        if( simulate_n_body ) {
            G = this.value * 1.0;
        }
    }

    var delta_t_slider = document.getElementById("delta_t_range");
    g_delta_t = 0.00005 * delta_t_slider.value / 10.0;
    delta_t_slider.oninput = function() {
        g_delta_t = 0.00005 * this.value / 10.0;
    }
    var collision_cb = document.getElementById("collisions");
    collision_setting = collision_cb.checked ? true : false;
    collision_cb.oninput = function() {
        collision_setting = collision_cb.checked ? true : false;
    }
    
}

function handle_key_down(event) {
    if( camera == null ) {
        return;
    }

    if (!event.shiftKey) {
        switch (event.code) {
            case "KeyA":
                camera.move_right(-1.0*camera_move_increment);  // X-Handedness is backwards
                break;
            case "KeyD":
                camera.move_left(-1.0*camera_move_increment);   // X-Handedness is backwards
                break;
            case "KeyS":
                camera.move_backward(camera_move_increment);
                break;
            case "KeyW":
                camera.move_forward(camera_move_increment);
                break;
            case "KeyQ":
                camera.move_up(camera_move_increment);
                break;
            case "KeyE":
                camera.move_down(camera_move_increment);
                break;
            case "ArrowLeft":
                camera.rotate_left(camera_angle_increment);
                break;
            case "ArrowRight":
                camera.rotate_right(camera_angle_increment);
                break;
            case "ArrowDown":
                camera.move_backward(camera_move_increment);
                break;
            case "ArrowUp":
                camera.move_forward(camera_move_increment);
                break;
        }
    } else if(event.shiftKey) {
        switch (event.code) {
            case "KeyA":
                camera.rotate_left(camera_angle_increment);
                break;
            case "KeyD":
                camera.rotate_right(camera_angle_increment);
                break;
            case "KeyS":
                camera.rotate_backward(camera_angle_increment);
                break;
            case "KeyW":
                camera.rotate_forward(camera_angle_increment);
                break;
            case "KeyQ":
                camera.rotate_clockwise(camera_angle_increment);
                break;
            case "KeyE":
                camera.rotate_counterclockwise(camera_angle_increment);
                break;
        }
    }
}

function main() {

}

function click_end_button() {
    run_flag = false;
}

function click_start_button() {

    if( run_flag ) {
        return;
    }

    run_flag = true;

    camera = new Camera(camera_start_location, camera_start_forward, camera_start_up, camera_start_right );

    attach_controls();

    collision_detection = collision_setting;

    setup_webgl();

    setup_shaders();

    var mass_texture = generate_mass_texture( gl );

    if( simulate_n_body ) {
        epsilon = epsilon_n_body;
    } else {
        epsilon = epsilon_solar_system;
    }

    particle_system = new ParticleSystem(gl, particle_count+1, mass_texture);
    if( !simulate_n_body ) {
        particle_system.add_particle( new Particle( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, sun_mass, sun_radius, sun_color ) ); // Sun
    }
    for( var c = 0; c < particle_count; ++c ) {
        var p = null;
        if( simulate_n_body ) {
            p = Particle.generate_n_body_particle(
                n_body_min_x, n_body_max_x,
                n_body_min_y, n_body_max_y,
                n_body_min_z, n_body_max_z,
                n_body_min_mass, n_body_max_mass );
        } else {
            p = Particle.generate_random_particle(
                0.0, 0.0, 0.0, sun_mass,   // sun x,y,z and mass
                min_orbital_radius, max_orbital_radius,  
                min_eccentricity, max_eccentricity,
                min_mass, max_mass );
        }
        particle_system.add_particle( p );
    }

    render_scene();
}
