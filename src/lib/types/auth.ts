// Authentication types matching backend API contract

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token?: string;
	message?: string;
}

export interface RegisterResponse {
	message?: string;
}

export interface User {
	username: string;
}

export interface LoginFormErrors {
	username?: string;
	password?: string;
	general?: string;
}

export interface RegisterFormErrors {
	username?: string;
	password?: string;
	confirmPassword?: string;
	general?: string;
}
