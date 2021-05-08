
// Camera class

class Camera {

	constructor(position, vec_forward, vec_up, vec_right) {
		this.position = vec3.fromValues(position[0], position[1], position[2]);
		this.vec_forward = vec3.fromValues(vec_forward[0], vec_forward[1], vec_forward[2]);

		vec3.normalize(this.vec_forward, this.vec_forward);
		this.vec_up = vec3.fromValues(vec_up[0], vec_up[1], vec_up[2]);

		vec3.normalize(this.vec_up, this.vec_up);
		this.vec_right = vec3.fromValues(vec_right[0], vec_right[1], vec_right[2]);

		vec3.normalize(this.vec_right, this.vec_right);
		this.camera_matrix = mat4.create();
		this.update_camera_matrix();
	}

	update_camera_matrix() {
		var center = vec3.create();
		vec3.add(center, this.position, this.vec_forward);
		mat4.lookAt(this.camera_matrix, this.position, center, this.vec_up);

		//console.log("camera position = " + this.position);

		// var invert_camera = this.get_invert_camera_matrix();
		// var test_point = vec4.fromValues(0.5, 0.5, 0.1, 1.0);
		// var trans_point = vec4.create();
		// vec4.transformMat4(trans_point, test_point, invert_camera);
		// console.log(trans_point);
		// test_point = vec4.fromValues(0.5, -0.5, 0.1, 1.0);
		// trans_point = vec4.create();
		// vec4.transformMat4(trans_point, test_point, invert_camera);
		// console.log(trans_point);
		// test_point = vec4.fromValues(-0.5, 0.5, 0.1, 1.0);
		// trans_point = vec4.create();
		// vec4.transformMat4(trans_point, test_point, invert_camera);
		// console.log(trans_point);
		// test_point = vec4.fromValues(-0.5, -0.5, 0.1, 1.0);
		// trans_point = vec4.create();
		// vec4.transformMat4(trans_point, test_point, invert_camera);
		// console.log(trans_point);
		// console.log(this.position);

		// // Let's compute distance of ll to eye.

		// var dist = ((this.position[0]-trans_point[0])**2 + (this.position[1]-trans_point[1])**2 + (this.position[2]-trans_point[2])**2);
		// console.log("distance = " + dist);
	}

	get_up_vector() {
		var up_copy = vec3.create();
		vec3.copy(up_copy, this.vec_up);
		return (up_copy);
	}

	get_right_vector() {
		var right_copy = vec3.create();
		vec3.copy(right_copy, this.vec_right);
		return (right_copy);
	}

	get_forward_vector() {
		var forward_copy = vec3.create();
		vec3.copy(forward_copy, this.vec_forward);
		return (forward_copy);
	}

	move_forward(dist) {
		var vec3_incr = vec3.create();
		vec3.scale(vec3_incr, this.vec_forward, dist);
		vec3.add(this.position, this.position, vec3_incr);
		this.update_camera_matrix();
		//console.log("position = " + this.position + " forward = " + this.vec_forward );
	}

	move_backward(dist) {
		this.move_forward(-1.0 * dist);
		//console.log("position = " + this.position + " forward = " + this.vec_forward );
	}

	move_right(dist) {
		var vec3_incr = vec3.create();
		vec3.scale(vec3_incr, this.vec_right, dist);
		vec3.add(this.position, this.position, vec3_incr);
		this.update_camera_matrix();
	}

	move_left(dist) {
		this.move_right(-1.0 * dist);
	}

	move_up(dist) {
		var vec3_incr = vec3.create();
		vec3.scale(vec3_incr, this.vec_up, dist);
		vec3.add(this.position, this.position, vec3_incr);
		this.update_camera_matrix();
	}

	move_down(dist) {
		this.move_up(-1.0 * dist);
	}

	rotate_left(angle_degrees) {
		var angle_radians = Math.PI / 180.0 * angle_degrees;
		var rot_mat = mat4.create();
		var fw_vec4 = vec4.create();
		var rt_vec4 = vec4.create();
		mat4.fromRotation(rot_mat, angle_radians, this.vec_up);
		mat4.multiply(fw_vec4, rot_mat, vec4.fromValues(this.vec_forward[0], this.vec_forward[1], this.vec_forward[2], 0.0));
		mat4.multiply(rt_vec4, rot_mat, vec4.fromValues(this.vec_right[0], this.vec_right[1], this.vec_right[2], 0.0));
		this.vec_forward = vec3.fromValues(fw_vec4[0], fw_vec4[1], fw_vec4[2]);
		vec3.normalize(this.vec_forward, this.vec_forward);
		this.vec_right = vec3.fromValues(rt_vec4[0], rt_vec4[1], rt_vec4[2]);
		vec3.normalize(this.vec_right, this.vec_right);
		this.update_camera_matrix();
	}

	rotate_right(angle_degrees) {
		this.rotate_left(-1.0 * angle_degrees);
	}

	rotate_backward(angle_degrees) {
		var angle_radians = Math.PI / 180.0 * angle_degrees;
		var rot_mat = mat4.create();
		var fw_vec4 = vec4.create();
		var up_vec4 = vec4.create();
		mat4.fromRotation(rot_mat, angle_radians, this.vec_right);
		mat4.multiply(fw_vec4, rot_mat, vec4.fromValues(this.vec_forward[0], this.vec_forward[1], this.vec_forward[2], 0.0));
		mat4.multiply(up_vec4, rot_mat, vec4.fromValues(this.vec_up[0], this.vec_up[1], this.vec_up[2], 0.0));
		this.vec_forward = vec3.fromValues(fw_vec4[0], fw_vec4[1], fw_vec4[2]);
		vec3.normalize(this.vec_forward, this.vec_forward);
		this.vec_up = vec3.fromValues(up_vec4[0], up_vec4[1], up_vec4[2]);
		vec3.normalize(this.vec_up, this.vec_up);
		this.update_camera_matrix();
	}

	rotate_forward(angle_degrees) {
		this.rotate_backward(-1.0 * angle_degrees);
	}

	rotate_clockwise(angle_degrees) {
		var angle_radians = -1.0 * Math.PI / 180.0 * angle_degrees;
		var rot_mat = mat4.create();
		var rt_vec4 = vec4.create();
		var up_vec4 = vec4.create();
		mat4.fromRotation(rot_mat, angle_radians, this.vec_forward);
		mat4.multiply(rt_vec4, rot_mat, vec4.fromValues(this.vec_right[0], this.vec_right[1], this.vec_right[2], 0.0));
		mat4.multiply(up_vec4, rot_mat, vec4.fromValues(this.vec_up[0], this.vec_up[1], this.vec_up[2], 0.0));
		this.vec_right = vec3.fromValues(rt_vec4[0], rt_vec4[1], rt_vec4[2]);
		vec3.normalize(this.vec_right, this.vec_right);
		this.vec_up = vec3.fromValues(up_vec4[0], up_vec4[1], up_vec4[2]);
		vec3.normalize(this.vec_up, this.vec_up);
		this.update_camera_matrix();
	}

	rotate_counterclockwise(angle_degrees) {
		this.rotate_clockwise(-1.0 * angle_degrees);
	}

	get_eye_x_position() {
		return this.position[0];
	}
	get_eye_y_position() {
		return this.position[1];
	}
	get_eye_z_position() {
		return this.position[2];
	}

	get_eye_position() {
		return( [this.position[0], this.position[1], this.position[2]]);
	}

	set_eye_position( pos ) {
		this.position[0] = pos[0];
		this.position[1] = pos[1];
		this.position[2] = pos[2];
	}

	get_camera_matrix() {
		var camera_matrix_copy = mat4.create();
		mat4.copy(camera_matrix_copy, this.camera_matrix);
		return camera_matrix_copy;
	}

	get_invert_camera_matrix( handedness_matrix ) {
		var invert_camera = mat4.create();

		mat4.invert(invert_camera, this.camera_matrix);
		return( invert_camera );
	}
}
