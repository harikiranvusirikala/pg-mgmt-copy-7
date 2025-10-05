package com.harikiran.pgmgmt.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "tenants")
public class Tenant {
	@Id
	private String id;
	private String name;
	private String email;
	private String phone;
	private String pictureUrl;
	private String mealPreference; // Veg / Non-Veg
	private String roomNo;
	private boolean due; // Payment due or not
	private boolean isActive;
	private Date renewalDate;
	private boolean continuousStay;

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
