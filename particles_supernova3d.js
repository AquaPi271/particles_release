"use strict";

var particle_count = 100;
var particle_radius = 0.01;

var gen_probability = 0.1;
var g_delta_t = 0.005;  // time step
var particle_size = 3.0;
var acceleration = -1.0;
var initial_speed = 1.0;

var canvas = null;
var particle_system = null;

// Webgl globals

var gl                        = null;                                   // graphics object
var vec4_clear_color          = vec4.fromValues( 0.0, 0.0, 0.0, 1.0 );  // color for clearing canvas
var shader_program            = null;                                   // compiled shader program
var mass_texture              = null;                                   // sprite particle texture

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

class ParticleSN {
    constructor(
        x,
        y,
        z,
        initial_speed,
        dir_x,
        dir_y,
        dir_z,
        rule,
        color
    ) {
        this.vec3_position = vec3.fromValues( x, y, z );
        this.vec3_dir      = vec3.fromValues( dir_x, dir_y, dir_z );
        vec3.normalize( this.vec3_dir, this.vec3_dir );
        
        this.speed = initial_speed;
        this.vec3_velocity = vec3.create();
        vec3.scale( this.vec3_velocity, this.vec3_dir, this.speed );

        this.acceleration = acceleration;
        this.vec3_acceleration = vec3.create();
        vec3.scale( this.vec3_acceleration, this.vec3_dir, this.acceleration );

        this.rule = rule;
        this.color = color.slice();

        this.alive = true;
    }

    clone( ) {
        var particle = new ParticleSN(this.vec3_position[0], this.vec3_position[1], this.vec3_position[2],
                                      this.speed,
                                      this.vec3_dir[0], this.vec3_dir[1], this.vec3_dir[2],
                                      this.rule, this.color);
        particle.alive = this.alive;
        return( particle );
    }

    is_dead() {
        return !this.alive;
    }

    update(delta_t) {

        this.speed += (this.acceleration * delta_t);

        if( this.speed <= 0.0 ) {
            this.alive = false;
        }

        vec3.scaleAndAdd(this.vec3_velocity, this.vec3_velocity, this.vec3_acceleration, delta_t);
        vec3.scaleAndAdd(this.vec3_position, this.vec3_position, this.vec3_velocity, delta_t);
    }

    static generate_random_particle(particle_color) {
        var dir_x = 0.0;
        var dir_y = 0.0;
        var dir_z = 0.0;

        while( 1 ) {
            dir_x = 2.0 * Math.random() - 1.0; 
            dir_y = 2.0 * Math.random() - 1.0; 
            dir_z = 2.0 * Math.random() - 1.0; 
            if( dir_x*dir_x + dir_y*dir_y + dir_z*dir_z <= 1.0 ) {
                break;
            }
        }

        var particle = new ParticleSN( 0.0, 0.0, 0.0, initial_speed, dir_x, dir_y, dir_z, 1, particle_color);
        return( particle );
    }
}

class ParticleSystemSN {
    constructor(
        gl,
        particle_capacity,
        sprite_texture
    ) {
        this.particle_capacity      = particle_capacity;
        this.sprite_gl_buffer       = gl.createBuffer();   // GL buffer object for vertices
        this.sprite_gl_uv_buffer    = gl.createBuffer();   // GL buffer object for UV coordinates
        this.sprite_gl_color_buffer = gl.createBuffer();   // GL buffer object for sprite color

        this.sprite_vertex_buffer  = new Float32Array(this.particle_capacity * 2 * 3 * 3);  // Holds sprite vertices
        this.sprite_uv_buffer      = new Float32Array(this.particle_capacity * 2 * 3 * 2);  // Hold sprite texture coordinates
        this.sprite_color_buffer   = new Float32Array(this.particle_capacity * 2 * 3 * 3);  // Hold sprite colors to be use

        this.particles = [];

        this.sprite_texture = sprite_texture;
    }

    add_particle( particle ) {
        var update_capacity = false;
        while( this.particles.length >= this.particle_capacity ) {
            this.particle_capacity *= 2;
            update_capacity = true;
        }
        
        if( update_capacity ) {
            this.sprite_vertex_buffer  = new Float32Array(this.particle_capacity * 2 * 3 * 3);
            this.sprite_uv_buffer      = new Float32Array(this.particle_capacity * 2 * 3 * 2);
            this.sprite_color_buffer   = new Float32Array(this.particle_capacity * 2 * 3 * 3);
        }

        this.particles.push( particle.clone() );
        return(true);
    }

    update_sprite_vertices_from_point( vec4_point, color, index, uv_index, color_index ) {

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
        return( [index, uv_index, color_index ] );
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
            var indices = this.update_sprite_vertices_from_point( vec4_transformed_point, particle.color, vertex_index, uv_index, color_index );
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
        // Simple linear loop.
        var delete_particle_indices = [];
        for( var p = 0; p < this.particles.length; ++p ) {
            var particle = this.particles[p];
            particle.update( delta_t );
            if( particle.is_dead() ) {
                delete_particle_indices.push(p);
            }
        }
        this.delete_particles( delete_particle_indices );

        if( Math.random() < gen_probability ) {
            var random_color = [Math.random(), Math.random(), Math.random()];
            // Up to particle count randomly chosen.
            var pc = Math.trunc( Math.random() * particle_count );
            for( var c = 0; c < particle_count; ++c ) {
                var p = null;
                p = ParticleSN.generate_random_particle( random_color );
                particle_system.add_particle( p );
            }
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

    window.requestAnimationFrame(render_scene);
}

function attach_controls() {
    var particle_size_slider = document.getElementById("particle_size_range");
    particle_radius = particle_size_slider.value * 0.01 / 10.0;
    particle_size_slider.oninput = function() {
        particle_radius = this.value * 0.01 / 10.0;
    }
    var shell_probability_slider = document.getElementById("shell_probability_range");
    gen_probability = shell_probability_slider.value / 20.0;
    shell_probability_slider.oninput = function() {
        gen_probability = this.value / 20.0;
    }
    var particle_count_slider = document.getElementById("particle_count_range");
    particle_count = particle_count_slider.value;
    particle_count_slider.oninput = function() {
        particle_count = this.value;
    }
    var initial_speed_slider = document.getElementById("initial_speed_range");
    initial_speed = initial_speed_slider.value / 10.0;
    initial_speed_slider.oninput = function() {
        initial_speed = this.value / 10.0;
    }
    var acceleration_slider = document.getElementById("acceleration_range");
    acceleration = -1.0 * initial_speed_slider.value / 10.0;
    acceleration_slider.oninput = function() {
        acceleration = -1.0 * this.value / 10.0;
    }
    var delta_t_slider = document.getElementById("delta_t_range");
    g_delta_t = 0.005 * delta_t_slider.value / 10.0;
    delta_t_slider.oninput = function() {
        g_delta_t = 0.005 * this.value / 10.0;
    }
    return;
    canvas.addEventListener('click', function(event) {
        if( event.button == 0 ) {
            // Upper left corner = 0,0 -> -1.0,1.0
            // Lower right corner = canvas.width,canvas.height, 1.0,-1.0
            px = 2.0 * event.clientX / canvas.width - 1.0;
            py = -2.0 * event.clientY / canvas.height + 1.0;
        }
    });
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

function main() {

    camera = new Camera(camera_start_location, camera_start_forward, camera_start_up, camera_start_right );
    
    setup_webgl();

    attach_controls();

    setup_shaders();

    mass_texture = generate_mass_texture( gl );

    particle_system = new ParticleSystemSN(gl, particle_count, mass_texture );
    var random_color = [Math.random(), Math.random(), Math.random()];
    for( var c = 0; c < particle_count; ++c ) {
        var p = null;
        p = ParticleSN.generate_random_particle( random_color );
        particle_system.add_particle( p );
    }

    render_scene();
}
