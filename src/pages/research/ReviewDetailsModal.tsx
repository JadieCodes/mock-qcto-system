// components/ReviewDetailsModal.tsx
import React from 'react';
import type { AgendaReview } from '@/types';

interface ReviewDetailsModalProps {
  review: AgendaReview;
  stage: string;
  onClose: () => void;
}

const ReviewDetailsModal: React.FC<ReviewDetailsModalProps> = ({ review, stage, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {stage} Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Reviewer</p>
              <p className="font-medium text-gray-900">{review.reviewedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900">{review.reviewRole}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Decision</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                review.decision === 'approve' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {review.decision === 'approve' ? 'Approved' : 'Rejected'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium text-gray-900">
                {review.reviewedAt.toLocaleDateString()} at {review.reviewedAt.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {review.comments && (
            <div>
              <p className="text-sm text-gray-500">Comments</p>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{review.comments}</p>
            </div>
          )}
          
          {review.minutesDocument && (
            <div>
              <p className="text-sm text-gray-500">Minutes Document</p>
              <a 
                href={review.minutesDocument.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
              >
                {review.minutesDocument.name}
              </a>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailsModal;