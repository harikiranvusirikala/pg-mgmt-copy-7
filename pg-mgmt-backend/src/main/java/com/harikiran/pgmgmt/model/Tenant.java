package com.harikiran.pgmgmt.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

/**
 * MongoDB document representing a paying tenant who occupies a room in the PG
 * facility.
 *
 * <p>
 * The entity mixes identity attributes sourced from Google authentication with
 * operational metadata such as room allocation, billing state and meal
 * preference. Business workflows rely on these fields for search, scheduling
 * and dashboard analytics.
 * </p>
 */
@Data
@Document(collection = "tenants")
public class Tenant {
	/**
	 * Unique identifier assigned by MongoDB.
	 */
	@Id
	private String id;

	/**
	 * Display name captured from Google or administrative edits.
	 */
	private String name;

	/**
	 * Primary email used for login and tenant look-ups.
	 */
	private String email;

	/**
	 * Optional contact number maintained by the tenant.
	 */
	private String phone;

	/**
	 * Profile picture URL from Google sign-in.
	 */
	private String pictureUrl;

	/**
	 * Meal preference selected by the tenant (Veg/Non-Veg).
	 */
	private String mealPreference; // Veg / Non-Veg

	/**
	 * Currently assigned room number, {@code null} if unallocated.
	 */
	private String roomNo;

	/**
	 * Flag indicating whether payment is overdue.
	 */
	private boolean due; // Payment due or not

	/**
	 * Whether the tenant is actively consuming meals for the current cycle.
	 */
	private boolean isActive;

	/**
	 * Renewal or vacate date depending on {@code continuousStay} preference.
	 */
	private Date renewalDate;

	/**
	 * Indicates if the tenant intends to stay beyond the renewal date.
	 */
	private boolean continuousStay;

	/**
	 * Constructs a tenant with the minimum Google identity attributes.
	 *
	 * @param name       tenant display name
	 * @param email      unique email identifier
	 * @param pictureUrl optional avatar URL returned by Google
	 */
	public Tenant(String name, String email, String pictureUrl) {
		this.name = name;
		this.email = email;
		this.pictureUrl = pictureUrl;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getPictureUrl() {
		return pictureUrl;
	}

	public void setPictureUrl(String pictureUrl) {
		this.pictureUrl = pictureUrl;
	}

	public String getMealPreference() {
		return mealPreference;
	}

	public void setMealPreference(String mealPreference) {
		this.mealPreference = mealPreference;
	}

	public String getRoomNo() {
		return roomNo;
	}

	public void setRoomNo(String roomNo) {
		this.roomNo = roomNo;
	}

	public boolean isDue() {
		return due;
	}

	public void setDue(boolean due) {
		this.due = due;
	}

	public boolean isActive() {
		return isActive;
	}

	public void setActive(boolean isActive) {
		this.isActive = isActive;
	}

	public Date getRenewalDate() {
		return renewalDate;
	}

	public void setRenewalDate(Date renewalDate) {
		this.renewalDate = renewalDate;
	}

	public boolean isContinuousStay() {
		return continuousStay;
	}

	public void setContinuousStay(boolean continuousStay) {
		this.continuousStay = continuousStay;
	}

}
