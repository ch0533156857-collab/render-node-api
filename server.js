import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// טיפול בשגיאות
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);

const service = {
  // קבלת כל המשימות
  getTasks: async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      // ✅ המרה מ-title ל-name, מ-completed ל-isComplete
      return response.data.map(task => ({
        id: task.id,
        name: task.title,
        isComplete: task.completed,
        description: task.description,
        created_at: task.created_at
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // הוספת משימה חדשה
  addTask: async (taskName) => {
    try {
      // ✅ שליחה עם title במקום name
      const response = await axios.post(`${API_URL}/tasks`, {
        title: taskName,
        description: ''
      });
      return response.data;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  // עדכון משימה
  setCompleted: async (id, isComplete) => {
    try {
      // ✅ קודם נקבל את המשימה הקיימת
      const tasksResponse = await axios.get(`${API_URL}/tasks`);
      const task = tasksResponse.data.find(t => t.id === id);
      
      if (!task) {
        throw new Error('Task not found');
      }

      // ✅ שליחה עם completed במקום isComplete
      const response = await axios.put(`${API_URL}/tasks/${id}`, {
        title: task.title,
        description: task.description || '',
        completed: isComplete
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // מחיקת משימה
  deleteTask: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

export default service;