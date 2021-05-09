var run_flag = false;

var collision_detection = false;
var collision_setting;
var simulate_n_body = true;

var particle_color = [1.0, 1.0, 0.0];
var particle_tail_color = [1.0, 0.0, 1.0];

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
var sun_radius = 1.0/512.0;

var min_orbital_radius = 0.3;  // anything past 1.0 may not be visible
var max_orbital_radius = 0.8;

var min_eccentricity = 0.8;  // > 0 
var max_eccentricity = 1.0;  // > 0  

var min_mass = 0.01;  // too heavy relative to Sun will de-stablize Sun
var max_mass = 0.1;

var min_radius = 1/512.0;
var max_radius = 1.001/512.0;

var flipped_orbit_probability = 0.1;

var n_body_min_x = -1.0;
var n_body_max_x = 1.0;
var n_body_min_y = -1.0;
var n_body_max_y = 1.0;
var n_body_min_mass = 10.0;
var n_body_max_mass = 100.0;
//var n_body_min_radius = 0.001;
//var n_body_max_radius = 0.001;
var n_body_min_radius = 1.0/512.0;
var n_body_max_radius = 1.0/512.0;

// var n_body_min_x = -0.1;
// var n_body_max_x = 0.1;
// var n_body_min_y = -0.5;
// var n_body_max_y = 0.5;
// var n_body_min_mass = 10.0;
// var n_body_max_mass = 100.0;

var particle_system = null;

// Graphics

var canvas = null;
var gl = null;
var clear_color = [0.0,0.0,0.0,1.0];
var shader_program = null;
var attribute_vertex = null;
var attribute_color = null;
var uniform_mode = null;


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
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;

        this.ax = 0.0;
        this.ay = 0.0;
        this.az = 0.0;

        this.mass = mass;
        this.fixed_pos = fixed_pos;
        this.color = color.slice();
        this.radius = radius;
    }

    clone( ) {
        var particle = new Particle(this.x, this.y, this.z, 
                                    this.vx, this.vy, this.vz, 
                                    this.mass, this.radius, this.color, this.fixed_pos);
        return( particle );
    }

    reset_acceleration( ) {
        this.ax = 0.0;
        this.ay = 0.0;
        this.az = 0.0;
    }

    interact( other_particle, bidirectional = true ) {
        var r2 = (this.x - other_particle.x)**2 + (this.y - other_particle.y)**2 + (this.z - other_particle.z)**2;  
        var r = Math.sqrt(r2);
        var collided = (other_particle.radius + this.radius) > r;
        if( collided ) {
            //console.log( "r1 = " + other_particle.radius);
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
        this.ax += (a_this * (other_particle.x - this.x) * rm1);
        this.ay += (a_this * (other_particle.y - this.y) * rm1);
        this.az += (a_this * (other_particle.z - this.z) * rm1);
        other_particle.ax += (a_other_particle * (this.x - other_particle.x) * rm1);
        other_particle.ay += (a_other_particle * (this.y - other_particle.y) * rm1);
        other_particle.az += (a_other_particle * (this.z - other_particle.z) * rm1);
        //return ( other_particle.radius + this.radius > r ); // return collision boolean
        return ( false ); // return collision boolean
    }
 
    update( delta_t ) {
        if( !this.fixed_pos ) {
            this.vx += (this.ax * delta_t);
            this.vy += (this.ay * delta_t);
            this.vz += (this.az * delta_t);

            this.x += (this.vx * delta_t);
            this.y += (this.vy * delta_t);
            this.z += (this.vz * delta_t);
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

    static generate_n_body_particle(min_x, max_x, min_y, max_y, mass_min, mass_max ) {

        var px   = (max_x - min_x) * Math.random() + min_x;
        var py   = (max_y - min_y) * Math.random() + min_y;
        var mass   = (mass_max - mass_min) * Math.random() + mass_min;
        var radius = Particle.compute_radius( mass_min, mass_max, mass, n_body_min_radius, n_body_max_radius );

        var particle = new Particle(px, py, 0.0, 0.0, 0.0, 0.0, mass, radius, particle_color );
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
        particle_count
    ) {
        this.particle_count = particle_count;
        this.gl_vertex_buffer = gl.createBuffer();
        this.gl_vertex_color_buffer = gl.createBuffer();
        this.vertex_buffer = new Float32Array(this.particle_count * 3);
        this.vertex_color_buffer = new Float32Array(this.particle_count * 3);
        this.particles = [];
    }
    add_particle( particle ) {
        if( this.particles.length >= this.particle_count ) {
            return(false);
        }
        this.particles.push( particle.clone() );
        return(true);
    }
    draw(gl) {
        var index = 0;
        for( var p = 0; p < this.particles.length; ++p ) {
            this.vertex_color_buffer[index] = this.particles[p].color[0]; 
            this.vertex_buffer[index++] = this.particles[p].x;
            this.vertex_color_buffer[index] = this.particles[p].color[1]; 
            this.vertex_buffer[index++] = this.particles[p].y;
            this.vertex_color_buffer[index] = this.particles[p].color[2]; 
            this.vertex_buffer[index++] = this.particles[p].z;
        }
        gl.uniform1i(uniform_mode, mode_points);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertex_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attribute_vertex,3,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_vertex_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertex_color_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attribute_color,3,gl.FLOAT,false,0,0);
        gl.drawArrays(gl.POINTS,0,this.particles.length);
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
            //console.log("count = " + this.particles.length);
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
        var pos_x = 0.0;
        var pos_y = 0.0;
        var pos_z = 0.0;
        var vel_x = 0.0;
        var vel_y = 0.0;
        var vel_z = 0.0;
        var merge_count = merge_list.length * 1.0;
        for( var pi = 0; pi < merge_list.length; ++pi ) {
            var p = merge_list[pi];
            mass_sum += this.particles[p].mass;
            pos_x += this.particles[p].x;
            pos_y += this.particles[p].y;
            pos_z += this.particles[p].z;
        }
        pos_x /= merge_count;
        pos_y /= merge_count;
        pos_z /= merge_count;
        for( var pi = 0; pi < merge_list.length; ++pi ) {
            var p = merge_list[pi];
            var mass_fraction = this.particles[p].mass/mass_sum;
            vel_x += (mass_fraction*this.particles[p].vx);
            vel_y += (mass_fraction*this.particles[p].vy);
            vel_z += (mass_fraction*this.particles[p].vz);
            //console.log("vel_x = " + vel_x);
            //console.log("vel_y = " + vel_y);
            //console.log("vel_z = " + vel_z);
        }

        var radius = null;
        if( simulate_n_body ) {
            radius = Particle.compute_radius(n_body_min_mass, n_body_max_mass, mass_sum, n_body_min_radius, n_body_max_radius);
        } else {
            radius = Particle.compute_radius(min_mass, max_mass, mass_sum, min_radius, max_radius);
        }
        var particle = new Particle( pos_x, pos_y, pos_z, vel_x, vel_y, vel_z, mass_sum, radius, particle_color );
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
    canvas = document.getElementById("myWebGLCanvas");
    gl = canvas.getContext("webgl");
    try {
        if( gl == null ) {
            throw "unable to get the webgl context from the browser page";
        } else {
            gl.clearColor( clear_color[0], clear_color[1], clear_color[2], clear_color[3] );
            gl.clearDepth( 1.0 );
            gl.enable( gl.DEPTH_TEST );
        }
    }
    
    catch(e) {
        console.log(e);
    }
}

function setup_shaders( ) {

    var vertex_shader_source = `
        precision mediump float;
        uniform int mode;
        attribute vec3 vertex_position;
        attribute vec3 a_color;
        varying vec3 v_color;

        void main(void) {
            gl_PointSize = 3.0;
            gl_Position = vec4(vertex_position,1.0);
            v_color = a_color;
        }
    `;

    var fragment_shader_source = `
        precision mediump float;
        uniform int mode;
        varying lowp vec3 v_color;
        void main(void) {    
            if( mode == 1 ) {
                //gl_FragColor = vec4(0.0,1.0,0.0,1.0);
                gl_FragColor = vec4(v_color,1.0);
            } else {
                //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
                gl_FragColor = vec4(v_color,1.0);
            }
        }
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
        attribute_vertex = gl.getAttribLocation(shader_program, "vertex_position");
        attribute_color = gl.getAttribLocation(shader_program, "a_color");
        uniform_mode = gl.getUniformLocation(shader_program, "mode");
        gl.enableVertexAttribArray(attribute_vertex);
        gl.enableVertexAttribArray(attribute_color);
    }

    catch(e) {
        console.log(e);
    }
}

function render_scene( ) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0,0, canvas.width, canvas.height);
    
    particle_system.update(g_delta_t);
    particle_system.draw(gl);

    collision_detection = collision_setting;

    if( run_flag ) {
        window.requestAnimationFrame(render_scene);
    }
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

    //var counter_probability_slider = document.getElementById("counter_probability_range");
    //flipped_orbit_probability = parseFloat(counter_probability_slider.value) / 100.0;

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

    attach_controls();

    collision_detection = collision_setting;

    setup_webgl();

    setup_shaders();

    if( simulate_n_body ) {
        epsilon = epsilon_n_body;
    } else {
        epsilon = epsilon_solar_system;
    }

    particle_system = new ParticleSystem(gl, particle_count+1);
    if( !simulate_n_body ) {
        particle_system.add_particle( new Particle( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, sun_mass, sun_radius, particle_color ) ); // Sun
    }
    for( var c = 0; c < particle_count; ++c ) {
        var p = null;
        if( simulate_n_body ) {
            p = Particle.generate_n_body_particle(
                n_body_min_x, n_body_max_x,
                n_body_min_y, n_body_max_y,
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
