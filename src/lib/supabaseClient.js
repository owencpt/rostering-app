// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ksgenquvxmaftrlztlfg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZ2VucXV2eG1hZnRybHp0bGZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc5Nzg3NywiZXhwIjoyMDcyMzczODc3fQ.a8Gx9lCqK1wDiU-vIRIBvQBtSJwIpW1gCTFfKII6n_U'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Authentication service
export const authService = {
  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser()
  },

  // Get current session
  getCurrentSession() {
    return supabase.auth.getSession()
  },

  // Sign up new user
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen for auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return data
  },

  // Update user password
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    return data
  }
}

// Database service functions
export const staffService = {
  // Get all staff members
  async getAllStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Get staff member by user ID
  async getStaffByUserId(userId) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new staff member (with auth link)
  async createStaff(staffData) {
    const avatar = staffData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    
    const { data, error } = await supabase
      .from('staff')
      .insert([{ ...staffData, avatar }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Add new staff member (legacy method - kept for compatibility)
  async addStaff(staffData) {
    return this.createStaff(staffData)
  },

  // Update staff member
  async updateStaff(id, updates) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete staff member
  async deleteStaff(id) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Get staff member's profile with user info
  async getStaffProfile(staffId) {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        user_id
      `)
      .eq('id', staffId)
      .single()
    
    if (error) throw error
    return data
  }
}

export const shiftsService = {
  // Get shifts for date range
  async getShifts(startDate, endDate) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar,
          user_id
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')
    
    if (error) throw error
    return data
  },

  // Get shifts for specific staff member
  async getShiftsForStaff(staffId, startDate, endDate) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar,
          user_id
        )
      `)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')
    
    if (error) throw error
    return data
  },

  // Get shifts for specific date
  async getShiftsByDate(date) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar,
          user_id
        )
      `)
      .eq('date', date)
      .order('start_time')
    
    if (error) throw error
    return data
  },

  // Create new shift
  async createShift(shiftData) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar,
          user_id
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Update shift
  async updateShift(id, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          role,
          avatar,
          user_id
        )
      `)
    
    if (error) throw error
    return data[0]
  },

  // Delete shift
  async deleteShift(id) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Delete shifts by staff and time range (for removing partial hours)
  async deleteShiftsByTimeRange(staffId, date, startTime, endTime) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('staff_id', staffId)
      .eq('date', date)
      .gte('start_time', startTime)
      .lte('end_time', endTime)
    
    if (error) throw error
  }
}

export const clockService = {
  // Get today's clock entries for all staff
  async getTodaysClockEntries(date) {
    const { data, error } = await supabase
      .from('clock_entries')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          avatar,
          user_id
        ),
        shift:shift_id (
          id,
          start_time,
          end_time
        )
      `)
      .eq('date', date)
    
    if (error) throw error
    return data
  },

  // Get clock entries for specific staff member
  async getClockEntriesForStaff(staffId, startDate, endDate) {
    const { data, error } = await supabase
      .from('clock_entries')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          avatar,
          user_id
        ),
        shift:shift_id (
          id,
          start_time,
          end_time
        )
      `)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('clock_in_time', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Clock in/out
  async clockInOut(staffId, action, shiftId = null) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    if (action === 'in') {
      // Create new clock entry
      const { data, error } = await supabase
        .from('clock_entries')
        .insert([{
          staff_id: staffId,
          shift_id: shiftId,
          clock_in_time: now.toISOString(),
          date: today
        }])
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            avatar
          )
        `)
        .single()
      
      if (error) throw error
      return data
    } else {
      // Update existing clock entry with clock out
      const { data, error } = await supabase
        .from('clock_entries')
        .update({ clock_out_time: now.toISOString() })
        .eq('staff_id', staffId)
        .eq('date', today)
        .is('clock_out_time', null)
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            avatar
          )
        `)
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Get current clock status for staff
  async getCurrentClockStatus(staffId, date) {
    const { data, error } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('staff_id', staffId)
      .eq('date', date)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data[0] || null
  },

  // Create clock entry (manual entry by admin)
  async createClockEntry(clockData) {
    const { data, error } = await supabase
      .from('clock_entries')
      .insert([clockData])
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          avatar
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Update clock entry
  async updateClockEntry(id, updateData) {
    const { data, error } = await supabase
      .from('clock_entries')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          avatar
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Delete clock entry
  async deleteClockEntry(id) {
    const { error } = await supabase
      .from('clock_entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Utility functions for data transformation
export const dataTransformers = {
  // Convert database shift to app format
  shiftToAppFormat(dbShift) {
    return {
      id: dbShift.id,
      staffId: dbShift.staff_id,
      date: dbShift.date,
      startTime: dbShift.start_time.substring(0, 5), // Remove seconds
      endTime: dbShift.end_time.substring(0, 5), // Remove seconds
      role: dbShift.role,
      staff: dbShift.staff
    }
  },

  // Convert app shift to database format
  appToShiftFormat(appShift) {
    return {
      staff_id: appShift.staffId,
      date: appShift.date,
      start_time: appShift.startTime,
      end_time: appShift.endTime,
      role: appShift.role
    }
  },

  // Convert database staff to app format
  staffToAppFormat(dbStaff) {
    return {
      id: dbStaff.id,
      name: dbStaff.name,
      email: dbStaff.email,
      role: dbStaff.role,
      avatar: dbStaff.avatar,
      userId: dbStaff.user_id
    }
  },

  // Convert database clock entry to app format
  clockEntryToAppFormat(dbClockEntry) {
    return {
      id: dbClockEntry.id,
      staffId: dbClockEntry.staff_id,
      shiftId: dbClockEntry.shift_id,
      clockInTime: dbClockEntry.clock_in_time,
      clockOutTime: dbClockEntry.clock_out_time,
      date: dbClockEntry.date,
      staff: dbClockEntry.staff,
      shift: dbClockEntry.shift
    }
  }
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to staff changes
  subscribeToStaff(callback) {
    return supabase
      .channel('staff-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staff'
      }, callback)
      .subscribe()
  },

  // Subscribe to shift changes
  subscribeToShifts(callback) {
    return supabase
      .channel('shifts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shifts'
      }, callback)
      .subscribe()
  },

  // Subscribe to clock entries changes
  subscribeToClockEntries(callback) {
    return supabase
      .channel('clock-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clock_entries'
      }, callback)
      .subscribe()
  },

  // Subscribe to auth changes
  subscribeToAuth(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions for role-based access
export const rbacHelpers = {
  // Check if user is admin or manager
  isAdmin(userRole) {
    return ['admin', 'manager'].includes(userRole?.toLowerCase())
  },

  // Check if user can manage staff
  canManageStaff(userRole) {
    return ['admin', 'manager'].includes(userRole?.toLowerCase())
  },

  // Check if user can manage schedules
  canManageSchedules(userRole) {
    return ['admin', 'manager'].includes(userRole?.toLowerCase())
  },

  // Check if user can view all data
  canViewAllData(userRole) {
    return ['admin', 'manager'].includes(userRole?.toLowerCase())
  },

  // Get allowed actions for user role
  getAllowedActions(userRole) {
    const role = userRole?.toLowerCase()
    
    switch (role) {
      case 'admin':
        return {
          canManageStaff: true,
          canManageSchedules: true,
          canViewAllData: true,
          canManageSettings: true,
          canViewReports: true
        }
      case 'manager':
        return {
          canManageStaff: true,
          canManageSchedules: true,
          canViewAllData: true,
          canManageSettings: false,
          canViewReports: true
        }
      case 'staff':
      default:
        return {
          canManageStaff: false,
          canManageSchedules: false,
          canViewAllData: false,
          canManageSettings: false,
          canViewReports: false
        }
    }
  }
}