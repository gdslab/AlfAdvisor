import { useEffect, useState } from 'react';
import useToken from './Authentication/hooks/useToken';
import classes from './ManageUsers.module.css';

const ManageUsers = () => {
  const token = useToken();
  const [users, setUsers] = useState([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Check if the user is a superuser
        const superuserResponse = await fetch('/alfalfa/auth/check-superuser', {
          method: 'GET',
          headers: {
            "Content-type": "application/json",
            "Authorization": 'Bearer ' + token
          },
        });

        if (!superuserResponse.ok) {
          throw new Error("Unauthorized access");
        }

        const superuserData = await superuserResponse.json();
        if (!superuserData.is_superuser) {
          setLoading(false);
          return;
        }
        setIsSuperuser(true);

        // Fetch all users
        const response = await fetch('/alfalfa/auth/get-users', {
          method: 'GET',
          headers: {
            "Content-type": "application/json",
            "Authorization": 'Bearer ' + token
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handlePasswordUpdate = async (userId) => {
    if (!newPassword) {
      alert("Please enter a new password.");
      return;
    }

    try {
      const response = await fetch('/alfalfa/auth/update-password', {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + token
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      alert("Password updated successfully!");
      setEditingUser(null);  // Close the edit password form
      setNewPassword("");     // Reset password field
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!isSuperuser) return <p>Access Denied. Only Superusers can manage users.</p>;

  return (
    <div className={classes.container}>
      <h2>Manage Users</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Superuser</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.first_name}</td>
              <td>{user.last_name}</td>
              <td>{user.is_superuser ? 'Yes' : 'No'}</td>
              <td>
                <button className={classes.btnEdit} onClick={() => setEditingUser(user.id)}>
                  Edit Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUser && (
        <div className={classes.modal}>
          <div className={classes.modalContent}>
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={classes.input}
            />
            <div className={classes.modalButtons}>
              <button className={classes.btnSave} onClick={() => handlePasswordUpdate(editingUser)}>
                Save
              </button>
              <button className={classes.btnCancel} onClick={() => setEditingUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
