var particle_count = 100;
var gen_probability = 0.1;
var g_delta_t = 0.005;  // time step
var particle_size = 3.0;
var acceleration = -1.0;
var initial_speed = 1.0;
var px = 0.0;
var py = 0.0;

var particle_system = null;

// Controls

// Graphics

var canvas = null;
var gl = null;
var clear_color = [0.0,0.0,0.0,1.0];
var shader_program = null;
var attribute_vertex = null;
var attribute_color = null;
var uniform_point_size = null;

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
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.dir_x = dir_x;
        this.dir_y = dir_y;
        this.dir_z = dir_z;

        var dir_length = Math.sqrt(this.dir_x*this.dir_x + this.dir_y*this.dir_y + this.dir_z*this.dir_z);
        this.dir_x = dir_x / dir_length;
        this.dir_y = dir_y / dir_length;
        this.dir_z = dir_z / dir_length;

        this.speed = initial_speed;
        this.vx = this.speed * this.dir_x;
        this.vy = this.speed * this.dir_y;
        this.vz = this.speed * this.dir_z;

        this.acceleration = acceleration;
        this.ax = this.acceleration * this.dir_x;
        this.ay = this.acceleration * this.dir_y;
        this.az = this.acceleration * this.dir_z;

        this.rule = rule;
        this.color = color.slice();

        this.alive = true;
    }

    clone( ) {
        var particle = new ParticleSN(this.x, this.y, this.z, 
                                      this.speed,
                                      this.dir_x, this.dir_y, this.dir_z,
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

        this.vx += (this.ax * delta_t);
        this.vy += (this.ay * delta_t);
        this.vz += (this.az * delta_t);

        this.x += (this.vx * delta_t);
        this.y += (this.vy * delta_t);
        this.z += (this.vz * delta_t);

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

        var particle = new ParticleSN( px, py, 0.0, initial_speed, dir_x, dir_y, 0.0, 1, particle_color);
        return( particle );
    }
}

class ParticleSystemSN {
    constructor(
        gl,
        particle_capacity
    ) {
        this.particle_capacity = particle_capacity;
        this.gl_vertex_buffer = gl.createBuffer();
        this.gl_vertex_color_buffer = gl.createBuffer();
        this.vertex_buffer = new Float32Array(this.particle_capacity * 3);
        this.vertex_color_buffer = new Float32Array(this.particle_capacity * 3);
        this.particles = [];
    }
    add_particle( particle ) {
        while( this.particles.length >= this.particle_capacity ) {
            this.particle_capacity *= 2;
        }
        this.vertex_buffer = new Float32Array(this.particle_capacity * 3);
        this.vertex_color_buffer = new Float32Array(this.particle_capacity * 3);

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
        gl.uniform1f(uniform_point_size, particle_size);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertex_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attribute_vertex,3,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_vertex_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertex_color_buffer, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(attribute_color,3,gl.FLOAT,false,0,0);
        gl.drawArrays(gl.POINTS,0,this.particles.length);
    }

    update( delta_t ) {
        // Simple linear loop.
        var delete_particle_indices = [];
        for( var p = 0; p < this.particles.length; ++p ) {
            var particle = this.particles[p];
            particle.update(g_delta_t);
            if( particle.is_dead() ) {
                delete_particle_indices.push(p);
            }
        }
        this.delete_particles( delete_particle_indices );
        // Make a new batch?

        if( Math.random() < gen_probability ) {
            var random_color = [Math.random(), Math.random(), Math.random()];
            // Up to particle count randomly chosen.
            // for( var c = 0; c < particle_count; ++c ) {
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
        attribute vec3 vertex_position;
        attribute vec3 a_color;
        varying vec3 v_color;
        uniform float uniform_point_size;

        void main(void) {
            gl_PointSize = uniform_point_size;
            gl_Position = vec4(vertex_position,1.0);
            v_color = a_color;
        }
    `;

    var fragment_shader_source = `
        precision mediump float;
        varying lowp vec3 v_color;
        void main(void) {    
            gl_FragColor = vec4(v_color,1.0);
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
        gl.enableVertexAttribArray(attribute_vertex);
        gl.enableVertexAttribArray(attribute_color);
        uniform_point_size = gl.getUniformLocation(shader_program, "uniform_point_size");
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

    window.requestAnimationFrame(render_scene);
}

function attach_controls() {
    var particle_size_slider = document.getElementById("particle_size_range");
    particle_size = particle_size_slider.value;
    particle_size_slider.oninput = function() {
        particle_size = this.value;
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
    canvas.addEventListener('click', function(event) {
        if( event.button == 0 ) {
            // Upper left corner = 0,0 -> -1.0,1.0
            // Lower right corner = canvas.width,canvas.height, 1.0,-1.0
            px = 2.0 * event.clientX / canvas.width - 1.0;
            py = -2.0 * event.clientY / canvas.height + 1.0;
        }
    });
}

function main() {
    setup_webgl();

    attach_controls();

    setup_shaders();

    particle_system = new ParticleSystemSN(gl, particle_count);
    var random_color = [Math.random(), Math.random(), Math.random()];
    for( var c = 0; c < particle_count; ++c ) {
        var p = null;
        p = ParticleSN.generate_random_particle( random_color );
        particle_system.add_particle( p );
    }

    render_scene();
}
