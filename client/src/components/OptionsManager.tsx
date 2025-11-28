import { useState, useEffect } from 'react';
import { optionsAPI } from '../services/api';
import type { Option } from '../services/api';
import './OptionsManager.scss';

const OptionsManager = () => {
  const [options, setOptions] = useState<Option[]>([]);
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [secretKey, setSecretKey] = useState(''); 

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await optionsAPI.getAll();
      setOptions(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    if(options.find(opt => opt.text.toLowerCase() === newOption.trim().toLowerCase())) {
      alert('This option already exists.');
      return;
    }
    try {
      await optionsAPI.create(newOption);
      setNewOption('');
      fetchOptions();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to add option';
      alert(message);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      await optionsAPI.delete(id);
      fetchOptions();
    } catch (err) {
      alert('Failed to delete option');
    }
  };

  if (loading) {
    return <div className="options-manager loading">Loading options...</div>;
  }

  return (
    <div className="options-manager">
      <h1>Manage Bingo Options</h1>
      
      <form onSubmit={handleAddOption} className="add-option-form">
        <input
          type="text"
          placeholder="Enter new bingo option..."
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          className="option-input"
          maxLength={50}
        />
        <button type="submit" className="btn btn-primary">
          Add Option
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <div className="options-list">
        <h2>Current Options ({options.length})</h2>
        {options.length === 0 ? (
          <p className="empty-message">No options yet. Add your first one above!</p>
        ) : (
          <ul>
            {options.map((option) => (
              <li key={option._id} className="option-item">
                <span className="option-text">{option.text}</span>
                <button
                  onClick={() => handleDeleteOption(option._id)}
                  className="btn btn-danger btn-small"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OptionsManager;
